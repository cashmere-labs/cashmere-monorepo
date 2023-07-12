import { useMemo, useState } from 'react';
import { useMediaQuery } from 'react-responsive';
import { Button, Input, Modal, Spinner } from '../../../ui';

import styles from './Liquidity.module.scss';
import { useInjection } from 'inversify-react';
import ThemeStore from '../../../store/ThemeStore';
import { observer } from 'mobx-react-lite';
import PoolStore, { pools } from '../../../store/PoolStore';
import {
    Address,
    erc20ABI,
    useAccount,
    useBalance,
    useNetwork,
    useSwitchNetwork,
    useToken
} from 'wagmi';
import { formatBalance } from '../../../utils/formatBalance';
import Big from 'big.js';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import toBig from '../../../utils/toBig';
import { AuthStore } from '../../../store/AuthStore';
import { readContract, writeContract } from "@wagmi/core";
import { MAX_UINT256 } from "../../../constants/utils";
import { runInAction } from "mobx";

const depositFunctionAbi = {
    "inputs": [
        {
            "internalType": "address",
            "name": "to",
            "type": "address"
        },
        {
            "internalType": "uint16",
            "name": "poolId",
            "type": "uint16"
        },
        {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
        }
    ],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
} as const;

const Liquidity = observer(({ onSuccess }: { onSuccess: () => void }) => {
    const themeStore = useInjection(ThemeStore);
    const poolStore = useInjection(PoolStore);
    const authStore = useInjection(AuthStore);

    const account = useAccount();
    const { chain } = useNetwork();
    const { openConnectModal } = useConnectModal();
    const { switchNetworkAsync } = useSwitchNetwork();
    const [ waitingConfirmation, setWaitingConfirmation ] = useState(false);
    const [ value, setValue ] = useState('');

    const pool = pools[poolStore.whichGlobalModal];
    const { data: rawBalance, isLoading: balanceLoading } = useBalance({
        address: account?.address,
        token: pool?.tokenAddress,
        chainId: pool?.network
    });
    const balance = rawBalance?.formatted.replace(/\.0*$/, '');
    const bigBalance = toBig(balance || '0');
    const { data: token } = useToken({
        address: pool?.tokenAddress,
        chainId: pool?.network
    });
    const bigTokenDecimals = new Big(10).pow(token?.decimals || 0);

    const isPhoneOrPC = useMediaQuery({
        query: '(max-width: 600px)',
    });

    const rightNetwork = useMemo(() => pool?.network === chain?.id, [chain?.id, pool?.network]);

    const insufficientFunds = useMemo(() => {
        return bigBalance.lt(toBig(value));
    }, [bigBalance, value]);

    const buttonLabel = useMemo(() => {
        if (authStore.status !== 'authenticated')
            return 'Connect wallet';
        if (insufficientFunds)
            return 'Insufficient funds';
        if (!rightNetwork)
            return 'Switch network';
        return 'Add liquidity';
    }, [insufficientFunds, authStore.status, rightNetwork]);

    const buttonAction = async () => {
        const status = runInAction(() => authStore.status);
        if (status !== 'authenticated') {
            openConnectModal?.();
            return;
        }
        if (!rightNetwork) {
            await switchNetworkAsync?.(pool?.network);
            return;
        }
        setWaitingConfirmation(true);
        try {
            const amount = BigInt(toBig(value).mul(bigTokenDecimals).toFixed(0));
            const allowance = await readContract({
                abi: erc20ABI,
                address: pool?.tokenAddress,
                functionName: 'allowance',
                args: [account!.address!, pool!.crossRouterAddress],
            });
            if (allowance < amount) {
                await writeContract({
                    abi: erc20ABI,
                    address: pool?.tokenAddress,
                    functionName: 'approve',
                    args: [pool!.crossRouterAddress, MAX_UINT256],
                });
            }
            console.log([account?.address as Address, 1, amount]);
            await writeContract({
                abi: [depositFunctionAbi],
                address: pool?.crossRouterAddress,
                functionName: 'deposit',
                args: [account?.address as Address, 1, amount],
            });
        } finally {
            setWaitingConfirmation(false);
        }
        onSuccess();
    };

    const zeroBalance = bigBalance.lte(0);

    return (
        <div className={styles.wrapper}>
            {/*<div className={styles.title}>*/}
            {/*    <div>{`${isPlus ? 'Add' : 'Remove'}`} Liquidity</div>*/}
            {/*    <div className={isPlus ? styles.bgPlus : styles.bgMinus}>*/}
            {/*        <div className={styles.dot} onClick={() => setIsPlus(!isPlus)}>*/}
            {/*            {isPlus ? (*/}
            {/*                themeStore.theme === 'light' ? (*/}
            {/*                    <img src={WHITEPLUS}></img>*/}
            {/*                ) : (*/}
            {/*                    <img src={GRAYPLUS}></img>*/}
            {/*                )*/}
            {/*            ) : (*/}
            {/*                <img src={MINUS}></img>*/}
            {/*            )}*/}
            {/*        </div>*/}
            {/*    </div>*/}
            {/*</div>*/}
            <div className={styles.balance}>
                <div>
                    <Button
                        width={isPhoneOrPC ? '46px' : '65px'}
                        height="34px"
                        color={themeStore.theme === 'light' ? 'transparentWhite' : 'transparentBlack'}
                        disabled={zeroBalance}
                        onClick={() => setValue(formatBalance(bigBalance.div(4), 4, 0))}
                    >
                        25%
                    </Button>{' '}
                    <Button
                        width={isPhoneOrPC ? '46px' : '65px'}
                        height="34px"
                        color={themeStore.theme === 'light' ? 'transparentWhite' : 'transparentBlack'}
                        disabled={zeroBalance}
                        onClick={() => setValue(formatBalance(bigBalance.div(2), 4, 0))}
                    >
                        50%
                    </Button>{' '}
                    <Button
                        width={isPhoneOrPC ? '46px' : '65px'}
                        height="34px"
                        color={themeStore.theme === 'light' ? 'transparentWhite' : 'transparentBlack'}
                        disabled={zeroBalance}
                        onClick={() => setValue(formatBalance(bigBalance.mul(3).div(4), 4, 0))}
                    >
                        75%
                    </Button>
                    <Button
                        width={isPhoneOrPC ? '46px' : '65px'}
                        height="34px"
                        color={themeStore.theme === 'light' ? 'transparentWhite' : 'transparentBlack'}
                        disabled={zeroBalance}
                        onClick={() => setValue(formatBalance(bigBalance, 4, 0))}
                    >
                        MAX
                    </Button>
                </div>
                <div className={styles['balanceLabel']}>BALANCE: {balance || '0'}</div>
            </div>
            <div className={styles.inputBox}>
                <div className={styles.pattern}>
                    <img
                        className={styles.image}
                        // src={themeStore.theme === 'light' ? LOGOBLACK : LOGOWHITE}
                        src='https://assets-cdn.trustwallet.com/blockchains/polygon/assets/0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174/logo.png'
                    ></img>
                    <div className={styles.text}>USDC</div>
                </div>
                <Input
                    extendLeft
                    placeholder="Amount"
                    height={isPhoneOrPC ? '59px' : '71px'}
                    value={value}
                    onChange={(e) => setValue(e.target.value.replace(/[^\d.]/, '').replace('..', '.'))}
                />
            </div>
            {/*<div className={styles.depositingAmount}>*/}
            {/*    <div>*/}
            {/*        <div>Amount Depositing (After Fee)</div>*/}
            {/*        <Tooltip placement="top" content="Content coming here">*/}
            {/*            <Icon size={16}>*/}
            {/*                <InfoIcon/>*/}
            {/*            </Icon>*/}
            {/*        </Tooltip>*/}
            {/*    </div>*/}
            {/*    <div>24680 DAI</div>*/}
            {/*</div>*/}
            {/*<div className={styles.line}></div>*/}
            {/*<div className={styles.fee}>*/}
            {/*    <div>*/}
            {/*        <div>Fee</div>*/}
            {/*        <Tooltip placement="top" content="Content coming here">*/}
            {/*            <Icon size={16}>*/}
            {/*                <InfoIcon/>*/}
            {/*            </Icon>*/}
            {/*        </Tooltip>*/}
            {/*    </div>*/}
            {/*    <div>15.6235 DAI</div>*/}
            {/*</div>*/}
            {/*<div className={styles.line}></div>*/}
            {/*<div className={styles.totalDeposit}>*/}
            {/*    <div>*/}
            {/*        <div>My Total Deposits</div>*/}
            {/*        <Tooltip placement="top" content="Content coming here">*/}
            {/*            <Icon size={16}>*/}
            {/*                <InfoIcon/>*/}
            {/*            </Icon>*/}
            {/*        </Tooltip>*/}
            {/*    </div>*/}
            {/*    <div>34580.21 DAI</div>*/}
            {/*</div>*/}
            {/*<div className={styles.line}></div>*/}
            {/*<div className={styles.poolShare}>*/}
            {/*    <div>*/}
            {/*        <div>Pool Share</div>*/}
            {/*        <Tooltip placement="top" content="Content coming here">*/}
            {/*            <Icon size={16}>*/}
            {/*                <InfoIcon/>*/}
            {/*            </Icon>*/}
            {/*        </Tooltip>*/}
            {/*    </div>*/}
            {/*    <div>0.54%</div>*/}
            {/*</div>*/}
            <div className={styles.liquidityButton}>
                <Button
                    width="100%"
                    height={isPhoneOrPC ? '34px' : '56px'}
                    fontWeight="fw600"
                    color={themeStore.theme === 'light' ? 'black' : 'white'}
                    disabled={insufficientFunds || rightNetwork && toBig(value).eq(0)}
                    onClick={buttonAction}
                >
                    {buttonLabel}
                </Button>
            </div>
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
        </div>
    );
});

export { Liquidity };
