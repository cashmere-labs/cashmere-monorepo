import { observer } from "mobx-react-lite";
import { useAccount, useNetwork, useSwitchNetwork } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import React, { ReactElement, useEffect, useMemo, useRef, useState } from "react";
import { activeChains, Chain } from "../../constants/chains";
import { useDebounce, useModal } from "../../hooks";
import { useInjection } from "inversify-react";
import ThemeStore from "../../store/ThemeStore";
import { Api } from "../../utils/api";
import Big from "big.js";
import { Token } from "../../types/token";
import styles from "./SwapBox.module.scss";
import { SwapSettings } from "../SwapSettings/SwapSettings";
import { SwapConfirmation } from "../SwapConfirmation/SwapConfirmation";
import { Button, Icon, Input, Select } from "../../ui";
import { RotateIcon, SettingsIcon } from "../../assets/icons";
import { Row } from "../Row/Row";
import { formatValue } from "../../utils/formatValue";
import { TokenOrNetworkRenderer } from "../TokenOrNetworkRenderer/TokenOrNetworkRenderer";
import { SwapBoxDetails } from "./SwapBoxDetails";
import { QuestsModal } from "../Modals/QuestsModal/QuestsModal";
import { FaChevronRight } from "react-icons/fa";
import { SwapNetworkSelector } from "./SwapNetworkSelector";
import { fetchBalance } from "@wagmi/core";
import { isAddressEqual } from "viem";
import { PLACEHOLDER_ADDRESS } from "../../constants/utils";
import toBig from "../../utils/toBig";
import useAsyncEffect from "use-async-effect";
import { useSwapSettings } from "../SwapSettings/useSwapSettings";

const SwapBox = observer(() => {
    const themeStore = useInjection(ThemeStore);
    const api = useInjection(Api);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const swapSettings = useSwapSettings();

    const { chain } = useNetwork();
    const account = useAccount();

    const { switchNetworkAsync } = useSwitchNetwork();
    const { openConnectModal } = useConnectModal();

    // Swap params
    const [ fromAmount, setFromAmount ] = useState('');
    const [ toAmount, setToAmount ] = useState('');
    const [ fromChain, setFromChain ] = useState<Chain>(activeChains[0]);
    const [ toChain, setToChain ] = useState<Chain>(activeChains[1]);
    const [ fromToken, setFromToken ] = useState<Token>(activeChains[0].tokenList[0]);
    const [ toToken, setToToken ] = useState<Token>(activeChains[1].tokenList[0]);

    const fromChainModal = useModal();
    const toChainModal = useModal();
    const fromTokenModal = useModal();
    const toTokenModal = useModal();

    // Display info
    const [ minReceiveAmount, setMinReceiveAmount ] = useState('');
    const [ fee, setFee ] = useState('');
    const [ priceImpact, setPriceImpact ] = useState('');
    const [ estimateError, setEstimateError ] = useState<string>();
    const [ estimateLoading, setEstimateLoading ] = useState(false);
    const [ fromBalance, setFromBalance ] = useState<Big>();
    const [ toBalance, setToBalance ] = useState<Big>();

    // Modals
    const swapSettingsModal = useModal();
    const swapConfirmationModal = useModal();
    const questModal = useModal();

    const isRightNetwork = useMemo(() => chain?.id === fromChain?.id, [chain, fromChain]);
    const insufficientBalance = useMemo(() => Number.isFinite(parseFloat(fromAmount)) && fromBalance?.lt(fromAmount), [fromAmount, fromBalance]);

    useEffect(() => {
        if (!wrapperRef.current) return;
        if (fromChainModal.isOpen || toChainModal.isOpen) {
            wrapperRef.current.style.boxShadow = 'var(--shadow1)';
        } else {
            wrapperRef.current.style.boxShadow = 'none';
        }
    }, [fromChainModal.isOpen, toChainModal.isOpen]);

    useAsyncEffect(async () => {
        if (!account.address) {
            setFromBalance(undefined);
            return;
        }

        const fromBalance = await fetchBalance({
            address: account.address,
            chainId: fromChain.id,
            token: isAddressEqual(fromToken.address, PLACEHOLDER_ADDRESS) ? undefined : fromToken.address,
        });
        setFromBalance(toBig(fromBalance.formatted));
    }, [account.address, fromChain, fromToken]);

    useAsyncEffect(async () => {
        if (!account.address) {
            setToBalance(undefined);
            return;
        }

        const toBalance = await fetchBalance({
            address: account.address,
            chainId: toChain.id,
            token: isAddressEqual(toToken.address, PLACEHOLDER_ADDRESS) ? undefined : toToken.address,
        });
        setToBalance(toBig(toBalance.formatted));
    }, [account.address, toChain, toToken]);

    useEffect(() => {
        if (!chain)
            return;
        if (chain?.id !== fromChain.id && !chain.unsupported) {
            const sameToChain = chain.id === toChain.id;
            setFromChain(chain as Chain);
            setFromToken((chain as Chain).tokenList[0]);
            setToChain(sameToChain ? fromChain : toChain);
            setToToken(sameToChain ? fromToken : toToken);
        }
    }, [chain]);

    const reverse = () => {
        setFromChain(toChain);
        setToChain(fromChain);
        setFromToken(toToken);
        setToToken(fromToken);
    }

    const selectChain = (
        newChain: Chain,
        mainChain: Chain,
        oppositeChain: Chain,
        mainToken: Token,
        oppositeToken: Token,
        setMainChain: (_: Chain) => any,
        setOppositeChain: (_: Chain) => any,
        setMainToken: (_: Token) => any,
        setOppositeToken: (_: Token) => any,
    ) => {
        if (newChain.id === oppositeChain.id) {
            setOppositeChain(mainChain);
            setOppositeToken(mainChain.tokenList.filter(t => t.symbol === mainToken.symbol)[0]);
        }
        setMainChain(newChain);
        setMainToken(newChain.tokenList.filter(t => t.symbol === mainToken.symbol)[0]);
    }

    const getSwapButtonContent = () => {
        console.log(account.isConnected);
        if (!account.isConnected) return 'Connect Wallet';
        if (!isRightNetwork) return 'Switch network';
        if (insufficientBalance) return `Insufficient ${fromToken.symbol} balance`;
        if (estimateError) return estimateError;
        return 'Swap';
    };

    const handleButtonAction = async () => {
        if (!account.isConnected) {
            openConnectModal?.();
            return;
        }
        if (!isRightNetwork) {
            switchNetworkAsync?.(fromChain.id);
            return;
        }
        swapConfirmationModal.open();
    };

    const estimateAmount = useMemo(() => async () => {
        try {
            if (!parseFloat(fromAmount)) {
                setToAmount('0');
                setEstimateError('Input amount')
                return;
            }
            setEstimateError('Estimating...');
            const resp = await api.getSwapEstimate(fromChain.id, fromToken.address, Big(fromAmount).mul(`1e${fromToken.decimals}`).toFixed(0), toChain.id, toToken.address);
            if (!resp.error) {
                setToAmount(Big(resp.dstAmount).div(`1e${toToken.decimals}`).toString());
                setMinReceiveAmount(Big(resp.minReceivedDst).div(`1e${toToken.decimals}`).toString());
                setFee(resp.fee);
                setPriceImpact(resp.priceImpact);
                setEstimateError(undefined);
            } else if (resp.cause?.code === 'CALL_EXCEPTION' && resp.cause.reason) {
                setEstimateError(resp.cause.reason);
            }
        } finally {
            setEstimateLoading(false);
        }
    }, [fromChain, toChain, fromToken, toToken, fromAmount]);
    const estimateAmountDebounced = useDebounce(estimateAmount);

    useEffect(() => {
        setEstimateLoading(true);
        estimateAmountDebounced();
    }, [fromAmount, fromToken, fromChain, toToken, toChain, estimateAmountDebounced]);

    return (
        <div ref={wrapperRef} className={styles.wrapper}>
            <SwapSettings modal={swapSettingsModal} swapSettings={swapSettings}/>
            <SwapConfirmation
                data={{
                    fee: '24.169.287 USDT',
                    minimumReceived: '15.6235 USDT',
                    priceImpact: '0.05%',
                    rateAfterFee: '1 UST = 1.017 USDT',
                }}
                modalController={swapConfirmationModal}
                swapSettings={swapSettings}
                from={{
                    amount: fromAmount,
                    network: fromChain,
                    token: fromToken,
                }}
                to={{
                    amount: toAmount,
                    network: toChain,
                    token: toToken,
                }}
            />
            <div className={styles.header}>
                <div>
                    <span
                        className={styles.tab}
                        // onClick={() => setMethod('stable')}
                        style={{
                            // color: method === 'stable' ? 'var(--text)' : 'var(--subtext)',
                            color: 'var(--text)',
                            cursor: 'default',
                        }}
                    >
                        Swap
                    </span>
                    <span
                        className={styles.tab}
                        // onClick={() => setMethod('aggregator')}
                        onClick={() => questModal.open()}
                        style={{
                            // color: method === 'aggregator' ? 'var(--text)' : 'var(--subtext)',
                            color: 'var(--subtext)',
                            cursor: 'pointer',
                        }}
                    >
                        Show Quests
                    </span>
                </div>

                {/*<Tooltip placement='top' content='ETH Goerli is deactivated due to unstable network conditions'>*/}
                {/*    <Icon*/}
                {/*        style={{ color: 'var(--icon-dark)' }}*/}
                {/*        hoverPadding="6px"*/}
                {/*        size={21}*/}
                {/*        hoverable*/}
                {/*    >*/}
                {/*        <MdInfoOutline size={21} />*/}
                {/*    </Icon>*/}
                {/*</Tooltip>*/}
                <Icon
                    onClick={swapSettingsModal.open}
                    style={{ color: 'var(--icon-dark)' }}
                    hoverPadding="6px"
                    size={16}
                    hoverable
                >
                    <SettingsIcon/>
                </Icon>
            </div>
            {/* FROM */}
            <Row
                className={styles.inputLabel}
                marginTop={24}
                marginBottom={6}
                justifyContent="space-between"
            >
                <span>From</span>
                <span>BALANCE: {formatValue(fromBalance?.toString(), 4)}</span>
            </Row>
            <Row>
                <Select
                    disableDefaultMode
                    onClick={() => {
                        fromChainModal.open();
                    }}
                    containerClassName={styles.select}
                    extendRight
                    isFullWidth
                    menuRenderer={() => (
                        <TokenOrNetworkRenderer tokenOrNetwork={fromChain}/>
                    )}
                    value={fromChain}
                    options={activeChains}
                    hideRightBorder
                />
                <Select
                    disableDefaultMode
                    containerClassName={styles.select}
                    extendRight
                    extendLeft
                    isFullWidth
                    menuRenderer={() => (
                        <TokenOrNetworkRenderer tokenOrNetwork={fromToken}/>
                    )}
                    value={fromToken}
                    options={fromChain.tokenList /*tokenOptions*/}
                    onClick={() => {
                        fromTokenModal.open();
                    }}
                />
                <Input
                    placeholder="Enter amount"
                    className={styles.input}
                    extendLeft
                    hideLeftBorder
                    value={fromAmount}
                    onChange={e => {
                        const value = e.target.value.replace(/[^\d.]/, '').replace('..', '.');
                        setFromAmount(value);
                    }}
                    rightEl={
                        <Button
                            width="18px" color="white"
                            onClick={() => setFromAmount(fromBalance?.toString() || '' )}
                        >
                            Max
                        </Button>
                    }
                />
            </Row>
            {/* FROM ENDS */}
            {/* ROTATE CIRCLE */}
            <Row marginTop={20} marginBottom={8} justifyContent="center">
                <Icon
                    onClick={reverse}
                    borderRadius="8px"
                    size={26}
                    style={{ color: 'var(--icon-dark)' }}
                    hoverable
                >
                    <RotateIcon/>
                </Icon>
            </Row>
            {/* ROTATE CIRCLE ENDS */}
            {/* TO */}
            <Row
                className={styles.inputLabel}
                marginBottom={6}
                justifyContent="space-between"
            >
                <span>To</span>
                <span>BALANCE: {formatValue(toBalance?.toString(), 4)}</span>
            </Row>
            <Row marginBottom={12}>
                <Select
                    disableDefaultMode
                    containerClassName={styles.select}
                    extendRight
                    isFullWidth
                    menuRenderer={() => (
                        <TokenOrNetworkRenderer tokenOrNetwork={toChain!}/>
                    )}
                    value={toChain}
                    options={activeChains}
                    hideRightBorder
                    onClick={() => {
                        toChainModal.open();
                    }}
                />
                <Select
                    disableDefaultMode
                    containerClassName={styles.select}
                    extendRight
                    extendLeft
                    isFullWidth
                    value={toToken}
                    menuRenderer={() => (
                        <TokenOrNetworkRenderer tokenOrNetwork={toToken}/>
                    )}
                    options={toChain.tokenList /*tokenOptions*/}
                    onClick={() => {
                        toTokenModal.open();
                    }}
                />
                <Input
                    className={styles.input}
                    extendLeft
                    hideLeftBorder
                    loading={estimateLoading}
                    value={formatValue(toAmount, 4)}
                    disabled
                />
            </Row>
            {/* TO ENDS */}
            <SwapBoxDetails
                data={{
                    fee,
                    minimumReceived: `${formatValue(minReceiveAmount, 4)} ${toToken.symbol}`,
                    priceImpact: `${formatValue(priceImpact, 4)}%`,
                    rateAfterFee: `1 ${fromToken.symbol} = ${parseFloat(toAmount) && parseFloat(fromAmount) && formatValue(new Big(toAmount).div(fromAmount).toString(), 4)} ${toToken.symbol}`,
                }}
            />
            <Button
                onClick={handleButtonAction}
                style={{ marginBottom: '1.5rem', marginTop: '2rem' }}
                height="56px"
                width="100%"
                color={themeStore.theme === 'dark' ? 'white' : 'black'}
                disabled={account.isConnected && isRightNetwork && (!!estimateError || insufficientBalance)}
            >
                {getSwapButtonContent()}
            </Button>
            <PathRenderer path={[fromChain, toChain]}/>
            <QuestsModal modal={questModal} />
            {fromChainModal.isOpen && (
                <SwapNetworkSelector
                    onSelect={(newFromChain: Chain | Token) => {
                        if (newFromChain instanceof Token)
                            return;
                        selectChain(
                            newFromChain,
                            fromChain,
                            toChain,
                            fromToken,
                            toToken,
                            setFromChain,
                            setToChain,
                            setFromToken,
                            setToToken,
                        );
                    }}
                    modalController={fromChainModal}
                    options={{
                        data: activeChains,
                        type: 'network',
                    }}
                />
            )}
            {toChainModal.isOpen && (
                <SwapNetworkSelector
                    onSelect={(newToChain: Chain | Token) => {
                        if (newToChain instanceof Token)
                            return;
                        selectChain(
                            newToChain,
                            toChain,
                            fromChain,
                            toToken,
                            fromToken,
                            setToChain,
                            setFromChain,
                            setToToken,
                            setFromToken,
                        );
                    }}
                    modalController={toChainModal}
                    options={{
                        data: activeChains,
                        type: 'network',
                    }}
                />
            )}
            {fromTokenModal.isOpen && (
                <SwapNetworkSelector
                    onSelect={(newFromToken: Chain | Token) => {
                        if (!(newFromToken instanceof Token))
                            return;
                        setFromToken(newFromToken);
                    }}
                    modalController={fromTokenModal}
                    options={{
                        data: fromChain.tokenList /*tokenOptions*/,
                        type: 'token',
                        network: fromChain,
                    }}
                />
            )}
            {toTokenModal.isOpen && (
                <SwapNetworkSelector
                    onSelect={(newToToken: Chain | Token) => {
                        if (!(newToToken instanceof Token))
                            return;
                        setFromToken(newToToken);
                    }}
                    modalController={toTokenModal}
                    options={{
                        data: toChain.tokenList /*tokenOptions*/,
                        type: 'token',
                        network: toChain,
                    }}
                />
            )}
        </div>
    );
});

const PathRenderer = ({ path }: { path: Chain[] }): ReactElement => {
    return (
        <Row
            marginBottom={8}
            style={{ marginLeft: 'auto', marginRight: 'auto', width: 'max-content' }}
            justifyContent="center"
        >
            {path.map((item, key) => (
                <Row
                    style={{ marginRight: key !== path.length - 1 ? '24px' : '0px' }}
                    justifyContent="center"
                    key={key}
                >
                    <TokenOrNetworkRenderer tokenOrNetwork={item} imgSize={20}/>
                    {key !== path.length - 1 && (
                        <Icon style={{ color: 'var(--text)', marginLeft: '16px' }}>
                            <FaChevronRight/>
                        </Icon>
                    )}
                </Row>
            ))}
        </Row>
    );
};

export { SwapBox };
