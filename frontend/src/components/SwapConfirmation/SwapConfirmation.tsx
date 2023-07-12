import { RotateIcon } from "../../assets/icons";
import { Row } from "../Row/Row";
import { ModalController } from '../../hooks/useModal';
import { ReactNode, useEffect, useState } from "react";
import { FaChevronRight } from "react-icons/fa";
import { SwapDetailsData } from "../../types/swap";
import { Token } from "../../types/token";
import { Button, Icon, Modal, Spinner } from '../../ui';

import { SwapSettings } from "../SwapSettings/useSwapSettings";
import { TokenOrNetworkRenderer } from "../TokenOrNetworkRenderer/TokenOrNetworkRenderer";

import styles from "./SwapConfirmation.module.scss";
import Big from "big.js";
import CashmereAggregatorUniswapABI from "../../abi/CashmereAggregatorUniswap.json";
import { useInjection } from 'inversify-react';
import ThemeStore from '../../store/ThemeStore';
import { observer } from 'mobx-react-lite';
import { Chain, lineaTestnet } from '../../constants/chains';
import {
  Address,
  erc20ABI,
  useAccount,
  useContractRead,
  usePublicClient,
  useSignTypedData,
  useWalletClient
} from "wagmi";
import PendingTxStore from '../../store/PendingTxStore';
import { Api } from '../../utils/api';
import {
  getPublicClient,
  readContract,
  sendTransaction,
  writeContract
} from "@wagmi/core";
import { MAX_UINT256 } from "../../constants/utils";
import { encodeFunctionData } from "viem";
import { estimateGas, getGasPrice } from "viem/public";
import toBig from "../../utils/toBig";

type SwapConfirmationModal = {
  swapSettings: SwapSettings;
  from: {
    amount: string;
    token: Token;
    network: Chain;
  };
  to: {
    amount: string;
    token: Token;
    network: Chain;
  };
  data: SwapDetailsData;
  modalController: ModalController;
};

const SwapConfirmation = observer(({
  modalController,
  swapSettings,
  from,
  to,
  data,
}: SwapConfirmationModal) => {
  const themeStore = useInjection(ThemeStore);
  const pendingTxStore = useInjection(PendingTxStore);
  const api = useInjection(Api);
  const { address: accountAddress } = useAccount();
  const provider = usePublicClient();
  const { data: signer } = useWalletClient();
  const { signTypedDataAsync } = useSignTypedData({});
  const [ insufficientFunds, setInsufficientFunds ] = useState(false);
  const [ feeRequired, setFeeRequired ] = useState<Big>();
  const [ waitingConfirmation, setWaitingConfirmation ] = useState(false);

  useEffect(() => setInsufficientFunds(false), [modalController.isOpen]);

  const _handleSwap = async () => {
    try {
      setWaitingConfirmation(true);

      const fromAmount = BigInt(new Big(from.amount).mul(new Big(10).pow(from.token.decimals)).toFixed(0));

      const resp = await api.getSwapParams(from.network.id, from.token.address, fromAmount.toString(), to.network.id, to.token.address, accountAddress!);
      console.log(resp);

      if (from.token.address !== '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
        const allowance = await readContract({
            abi: erc20ABI,
            address: from.token.address as Address,
            functionName: 'allowance',
            args: [accountAddress!, resp.to],
            chainId: from.network.id,
        });
        if (allowance < fromAmount) {
          const tx = await writeContract({
            abi: erc20ABI,
            address: from.token.address as Address,
            functionName: 'approve',
            args: [resp.to, MAX_UINT256],
            chainId: from.network.id,
          });
        }
      }

      const signature = await signTypedDataAsync({
        domain: {
          name: "Cashmere Swap",
          version: "0.0.2",
          chainId: from.network.id,
          verifyingContract: resp.to,
        },
        types: {
          Parameters: [
            { name: 'receiver', type: 'address' },
            { name: 'lwsPoolId', type: 'uint16' },
            { name: 'hgsPoolId', type: 'uint16' },
            { name: 'dstToken', type: 'address' },
            { name: 'minHgsAmount', type: 'uint256' },
          ]
        },
        message: {
            receiver: accountAddress!,
            lwsPoolId: parseInt(resp.args.lwsPoolId),
            hgsPoolId: parseInt(resp.args.hgsPoolId),
            dstToken: resp.args.dstToken,
            minHgsAmount: BigInt(resp.args.minHgsAmount) * 9n / 10n,
        },
        primaryType: "Parameters",
      });
      console.log(signature);

      console.log({
        srcToken: resp.args.srcToken,
        srcAmount: resp.args.srcAmount,
        lwsPoolId: resp.args.lwsPoolId,
        hgsPoolId: resp.args.hgsPoolId,
        dstToken: resp.args.dstToken,
        dstChain: resp.args.dstChain,
        dstAggregatorAddress: resp.args.dstAggregatorAddress,
        minHgsAmount: BigInt(resp.args.minHgsAmount) * 9n / 10n,
        signature: signature!,
      });
      const txData = encodeFunctionData({
        abi: CashmereAggregatorUniswapABI,
        functionName: "startSwap",
        args: [{
          srcToken: resp.args.srcToken,
          srcAmount: resp.args.srcAmount,
          lwsPoolId: resp.args.lwsPoolId,
          hgsPoolId: resp.args.hgsPoolId,
          dstToken: resp.args.dstToken,
          dstChain: resp.args.dstChain,
          dstAggregatorAddress: resp.args.dstAggregatorAddress,
          minHgsAmount: BigInt(resp.args.minHgsAmount) * 9n / 10n,
          signature: signature!,
        }]
      });

      let gasPrice = await getGasPrice(getPublicClient());
      if (from.network.id !== lineaTestnet.id)
        gasPrice *= 4n;
      const tx = {
        data: txData,
        account: accountAddress!,
        gasPrice,
        to: resp.to as Address,
        value: BigInt(resp.value),
        gas: from.network.estimateGasLimitOverride ? BigInt(from.network.estimateGasLimitOverride) : 8000000n,
      };

      console.log("beforeEstimate", tx);
      setFeeRequired(toBig(resp.value).div('1e18'));
      tx.gas = await estimateGas(getPublicClient(), tx) * 2n;
      setFeeRequired(toBig(tx.gas! * tx.gasPrice!).div('1e18'));
      console.log("afterEstimate", tx);
      const txPromise = sendTransaction(tx);
      // setIsConfirmed(true);
      const txResult = await txPromise;
      await api.submitSwapTx(from.network.id, txResult.hash);

      modalController.close();
      resp.swapData.swapInitiatedTxid = txResult.hash;
      pendingTxStore.addFakeTx(resp.swapData);
      pendingTxStore.setPendingWindowOpen(true);
      pendingTxStore.setSelectedTxId(resp.swapData.swapId);

      // const l0Interval = setInterval(async () => {
      //   const r = await fetch(`https://api-testnet.layerzero-scan.com/tx/${receipt?.hash}`);
      //   const data = await r.json();
      //   if (data?.messages?.length) {
      //     const m = data.messages[0];
      //     setL0Link(`https://testnet.layerzeroscan.com/${m.srcChainId}/address/${m.srcUaAddress}/message/${m.dstChainId}/address/${m.dstUaAddress}/nonce/${m.srcUaNonce}`);
      //     clearInterval(l0Interval);
      //   }
      // }, 1000);
    } catch (e) {
      console.error(e);
      const codes = [(e as any).code, (e as any).error?.code, (e as any).error?.error?.code];
      console.log(codes, JSON.parse(JSON.stringify(e)));
      for (const code of codes) {
        if ([-32000].includes(code)) {
          setInsufficientFunds(true);
          break;
        }
      }
    } finally {
      setWaitingConfirmation(false);
    }
  };

  // useEffect(() => {
  //   /**
  //    * @dev Reset the state on close
  //    */
  //   if (!modalController.isOpen) {
  //     setIsConfirmed(false);
  //   }
  // }, [modalController.isOpen]);

  return (
    <Modal
      bodyProps={{
        style: {
          padding: "36px 56px 12px 56px",
        },
      }}
      width="660px"
      isOpen={modalController.isOpen}
      close={modalController.close}
    >
      <Modal
          isOpen={waitingConfirmation}
          bodyProps={{
            style: {
              padding: 62,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            },
          }}
          width="660px"
      >
        <h2 style={{ margin: 0 }}>Confirm swap</h2>
        <div style={{ margin: '80px 0' }}><Spinner className={styles.spinner} size={120} /></div>
        <div>Please, sign order using your wallet</div>
      </Modal>
      <div className={styles.header}>
        <span>Confirm swap</span>
      </div>
      <SwapConfirmationContentRenderer
        showArrow={false}
        right={from.amount}
        left={<TokenOrNetworkRenderer tokenOrNetwork={from.token} />}
      />
      <Row justifyContent="center">
        <Icon size={24} style={{ marginTop: "12px" }}>
          <RotateIcon />
        </Icon>
      </Row>
      <SwapConfirmationContentRenderer
        showArrow={false}
        right={to.amount}
        left={<TokenOrNetworkRenderer tokenOrNetwork={to.token} />}
      />
      <Row>
        <SwapConfirmationContentRenderer
          showArrow={true}
          left={
            <Row>
              <span style={{ fontSize: "12px", marginRight: "12px" }}>
                From
              </span>
              <TokenOrNetworkRenderer
                type="badge"
                tokenOrNetwork={from.network}
              />
            </Row>
          }
          right={
            <Row justifyContent="flex-end">
              <span style={{ fontSize: "12px", marginRight: "12px" }}>To</span>
              <TokenOrNetworkRenderer
                type="badge"
                tokenOrNetwork={to.network}
              />
            </Row>
          }
        />
      </Row>
      {/*<SwapBoxDetails data={data} />*/}
      <Button
        onClick={_handleSwap}
        style={{ marginBottom: "1.5rem", marginTop: "2rem" }}
        height="56px"
        width="100%"
        color={themeStore.theme === "dark" ? "white" : "black"}
        disabled={insufficientFunds}
      >
        {insufficientFunds ? `Insufficient fee (${feeRequired?.toFixed(4)} ${from.network.nativeCurrency.symbol} required)` : 'Swap'}
      </Button>
    </Modal>
  );
});

const SwapConfirmationContentRenderer = ({
  left,
  right,
  showArrow,
}: {
  left: ReactNode;
  right: ReactNode;
  showArrow: boolean;
}) => {
  return (
    <div className={styles.wrapper}>
      <span className={styles.left}>{left}</span>
      <VerticalDivider showArrow={showArrow} />
      <span className={styles.right}>{right}</span>
    </div>
  );
};

const VerticalDivider = ({ showArrow }: { showArrow: boolean }) => {
  return (
    <div className={styles.arrowWrapper}>
      {showArrow ? (
        <div className={styles.arrow}>
          <Icon style={{ color: "var(--text)" }} size={12}>
            <FaChevronRight />
          </Icon>
        </div>
      ) : null}
      <div className={styles.divider}></div>
    </div>
  );
};

export { SwapConfirmation };
