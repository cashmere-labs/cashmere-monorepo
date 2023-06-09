import {
    NATIVE_PLACEHOLDER,
    isPlaceholderToken,
} from '@cashmere-monorepo/backend-blockchain';
import { GetTokenMetadataArgs } from '@cashmere-monorepo/backend-blockchain/src/repositories/progress.repository';
import { InvalidArgumentsError } from '@cashmere-monorepo/backend-core';
import { SwapDataDbDto } from '@cashmere-monorepo/backend-database';
import { DateTime } from 'luxon';
import { Address } from 'viem';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { StartSwapTxArgs, SwapParamsArgs, SwapParamsResponse } from '../../src';

describe('[Swap][Unit] Swap params', () => {
    // Mock params
    let getContractAddressThrows = false; // For testing main try...catch in getSwapParams

    // The tested functions
    let getLwsAmount: (
        needSrcSwap: boolean,
        amount: bigint,
        srcChainId: number,
        srcToken: Address,
        lwsToken: Address
    ) => Promise<bigint>;
    let getHgsAmount: (
        srcChainId: number,
        dstChainId: number,
        lwsAssetId: string,
        hgsAssetId: string,
        lwsAmount: bigint
    ) => Promise<bigint>;
    let getSwapTxValue: (
        srcChainId: number,
        dstChainId: number,
        srcTokenOriginal: Address,
        amount: bigint
    ) => Promise<bigint>;
    let buildSwapTxArgs: (
        srcTokenOriginal: Address,
        amount: bigint,
        lwsAssetId: string,
        hgsAssetId: string,
        dstTokenOriginal: Address,
        dstChainId: number,
        hgsAmount: bigint
    ) => StartSwapTxArgs;
    let buildPlaceholderSwapData: (
        srcChainId: number,
        dstChainId: number,
        srcTokenOriginal: Address,
        srcToken: Address,
        lwsToken: Address,
        hgsToken: Address,
        dstToken: Address,
        dstTokenOriginal: Address,
        amount: bigint,
        receiver: Address
    ) => Promise<SwapDataDbDto>;
    let getSwapParams: (params: SwapParamsArgs) => Promise<SwapParamsResponse>;

    beforeAll(async () => {
        // Mock backend-blockchain
        vi.doMock('@cashmere-monorepo/backend-blockchain', () => ({
            getUniswapRepository: () => ({
                getAmountOut: async ({ amount }: { amount: bigint }) => ({
                    dstAmount: amount * 2n,
                }),
            }),
            getAssetRouterRepository: () => ({
                quoteSwaps: async ({ amount }: { amount: bigint }) => ({
                    potentialOutcome: amount * 4n,
                }),
            }),
            getBridgeRepository: () => ({
                getSwapFeeL0: async () => 100500n,
            }),
            getL0ChainFromChainId: (chainId: number) => chainId + 1,
            isPlaceholderToken,
            getNetworkConfig: () => ({
                getContractAddress: (key: string) => {
                    if (getContractAddressThrows) throw new Error();
                    return `0x${key.toUpperCase()}`;
                },
            }),
            getProgressRepository: () => ({
                getTokenMetadata: ({
                    srcToken,
                    lwsToken,
                    hgsToken,
                    dstToken,
                }: GetTokenMetadataArgs) => ({
                    srcDecimals: 18,
                    srcTokenSymbol: srcToken,
                    lwsTokenSymbol: lwsToken,
                    hgsTokenSymbol: hgsToken,
                    dstTokenSymbol: dstToken,
                }),
            }),
        }));
        // Mock helpers
        vi.doMock('../../src/helpers/paramsUtils', () => ({
            getAllSwapParamsDatas: async (): Promise<{
                srcToken: Address;
                dstToken: Address;
                lwsAssetId: string;
                hgsAssetId: string;
                lwsToken: Address;
                hgsToken: Address;
                needSrcSwap: boolean;
                needDstSwap: boolean;
            }> => {
                return {
                    srcToken: '0xF29Ff96aaEa6C9A1fBa851f74737f3c069d4f1a9',
                    dstToken: '0xEDaf4083F29753753d0Cd6c3C50ACEb08c87b5BD',
                    lwsAssetId: '3',
                    hgsAssetId: '4',
                    lwsToken: '0x0107A6972E279d56e6F35d009Dd4f730cba9d9fa',
                    hgsToken: '0xe5E30E7c24e4dFcb281A682562E53154C15D3332',
                    needSrcSwap: true,
                    needDstSwap: false,
                };
            },
        }));
        // Import the tested functions after mocking dependencies
        ({
            getLwsAmount,
            getHgsAmount,
            getSwapTxValue,
            getSwapParams,
            buildSwapTxArgs,
            buildPlaceholderSwapData,
        } = await import('../../src/params/swapParams'));
    });

    beforeEach(() => {
        // Reset mock params before each test
        getContractAddressThrows = false;
    });

    describe('getLwsAmount', () => {
        it('[Ok] Retrieves LWS amount via uniswap', async () => {
            expect(await getLwsAmount(true, 10n, 1, '0x', '0x')).toEqual(20n);
        });

        it('[Ok] Returns LWS amount = SRC amount if src swap is not needed', async () => {
            expect(await getLwsAmount(false, 10n, 1, '0x', '0x')).toEqual(10n);
        });
    });

    it('[Ok] getHgsAmount via asset router', async () => {
        expect(await getHgsAmount(1, 1, '1', '1', 10n)).toEqual(40n);
    });

    describe('getSwapTxValue', () => {
        it('[Ok] Returns only the fee if src token is not native', async () => {
            expect(
                await getSwapTxValue(
                    1,
                    1,
                    '0x000000000000000000000000000000000000dEaD',
                    10n
                )
            ).toEqual(100500n);
        });

        it('[Ok] Returns fee + src amount if src token is native', async () => {
            expect(await getSwapTxValue(1, 1, NATIVE_PLACEHOLDER, 10n)).toEqual(
                100510n
            );
        });
    });

    it('[Ok] buildSwapArgs', async () => {
        expect(
            buildSwapTxArgs('0xSRC', 10n, '1', '2', '0xDST', 1, 20n)
        ).toEqual({
            srcToken: '0xSRC',
            srcAmount: '10',
            lwsPoolId: '1',
            hgsPoolId: '2',
            dstToken: '0xDST',
            dstChain: '2',
            dstAggregatorAddress: '0xAGGREGATOR',
            minHgsAmount: '20',
        });
    });

    it('[Ok] buildPlaceholderSwapData', async () => {
        // Freeze time to get the same swapInitiatedTimestamp
        const date = new Date(2000, 1, 1, 19);
        vi.setSystemTime(date);

        expect(
            await buildPlaceholderSwapData(
                1,
                2,
                '0xSRCo',
                '0xSRC',
                '0xLWS',
                '0xHGS',
                '0xDST',
                '0xDSTo',
                10n,
                '0xRECEIVER'
            )
        ).toEqual({
            swapId: '0x',
            chains: {
                srcChainId: 1,
                dstChainId: 2,
                srcL0ChainId: 0,
                dstL0ChainId: 0,
            },
            path: {
                lwsPoolId: 0,
                hgsPoolId: 0,
                hgsAmount: '0',
                dstToken: '0xDST',
                minHgsAmount: '0',
                fee: '0',
            },
            user: {
                receiver: '0xRECEIVER',
                signature: '0x',
            },
            status: {
                swapInitiatedTimestamp: DateTime.now().toUnixInteger(),
                swapInitiatedTxid: '0x',
            },
            progress: {
                srcToken: '0xSRC',
                srcAmount: '10',
                srcDecimals: 18,
                srcTokenSymbol: '0xSRCo',
                lwsTokenSymbol: '0xLWS',
                hgsTokenSymbol: '0xHGS',
                dstTokenSymbol: '0xDSTo',
            },
        });
    });

    describe('getSwapParams', () => {
        const srcToken = '0x3826539Cbd8d68DCF119e80B994557B4278CeC9f';
        const dstToken = '0x9029C772DDE847622DF1553eD9d9BDb7812e4f93';
        const receiver = '0x455E5AA18469bC6ccEF49594645666C587A3a71B';

        it('[Fail] Does not accept zero amount', async () => {
            await expect(
                getSwapParams({
                    srcChainId: 1,
                    srcToken,
                    amount: 0n,
                    dstChainId: 2,
                    dstToken,
                    receiver,
                })
            ).rejects.toThrow(InvalidArgumentsError);
        });

        it('[Fail] Does not accept same src and dst chains', async () => {
            await expect(
                getSwapParams({
                    srcChainId: 1,
                    srcToken,
                    amount: 10n,
                    dstChainId: 1,
                    dstToken,
                    receiver,
                })
            ).rejects.toThrow(InvalidArgumentsError);
        });

        it('[Ok] Generates correct response', async () => {
            // Freeze time to get the same swapInitiatedTimestamp
            const date = new Date(2000, 1, 1, 19);
            vi.setSystemTime(date);

            expect(
                await getSwapParams({
                    srcChainId: 1,
                    srcToken,
                    amount: 10n,
                    dstChainId: 2,
                    dstToken,
                    receiver,
                })
            ).toEqual({
                args: {
                    dstAggregatorAddress: '0xAGGREGATOR',
                    dstChain: '3',
                    dstToken: '0x9029C772DDE847622DF1553eD9d9BDb7812e4f93',
                    hgsPoolId: '4',
                    lwsPoolId: '3',
                    minHgsAmount: '80',
                    srcAmount: '10',
                    srcToken: '0x3826539Cbd8d68DCF119e80B994557B4278CeC9f',
                },
                swapData: {
                    chains: {
                        dstChainId: 2,
                        dstL0ChainId: 0,
                        srcChainId: 1,
                        srcL0ChainId: 0,
                    },
                    path: {
                        dstToken: '0xEDaf4083F29753753d0Cd6c3C50ACEb08c87b5BD',
                        fee: '0',
                        hgsAmount: '0',
                        hgsPoolId: 0,
                        lwsPoolId: 0,
                        minHgsAmount: '0',
                    },
                    progress: {
                        dstTokenSymbol:
                            '0x9029C772DDE847622DF1553eD9d9BDb7812e4f93',
                        hgsTokenSymbol:
                            '0xe5E30E7c24e4dFcb281A682562E53154C15D3332',
                        lwsTokenSymbol:
                            '0x0107A6972E279d56e6F35d009Dd4f730cba9d9fa',
                        srcAmount: '10',
                        srcDecimals: 18,
                        srcToken: '0xF29Ff96aaEa6C9A1fBa851f74737f3c069d4f1a9',
                        srcTokenSymbol:
                            '0x3826539Cbd8d68DCF119e80B994557B4278CeC9f',
                    },
                    status: {
                        swapInitiatedTimestamp: DateTime.now().toUnixInteger(),
                        swapInitiatedTxid: '0x',
                    },
                    swapId: '0x',
                    user: {
                        receiver: '0x455E5AA18469bC6ccEF49594645666C587A3a71B',
                        signature: '0x',
                    },
                },
                to: '0xAGGREGATOR',
                value: '100500',
            });
        });

        it('[Fail] Throws with a fixed message on errors', async () => {
            getContractAddressThrows = true;
            await expect(
                getSwapParams({
                    srcChainId: 1,
                    srcToken,
                    amount: 10n,
                    dstChainId: 2,
                    dstToken,
                    receiver,
                })
            ).rejects.toThrow('Unable to generate swap params');
        });
    });
});
