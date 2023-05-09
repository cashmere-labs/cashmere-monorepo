import {
    getNetworkConfigAndClient,
    iUniswapV2Router02ABI,
} from '@cashmere-monorepo/shared-blockchain';
import { Address } from 'viem';
import { ONE_INCH_SLIPPAGE } from '../utils';

// Generic interface for our uniswap repository
export type UniswapRepository = {
    getAmountOut: (params: {
        amount: bigint;
        minAmount?: bigint;
        fromToken: Address;
        toToken: Address;
    }) => Promise<{
        dstAmount: bigint;
        minDstAmount: bigint;
    }>;
};

export const getUniswapRepository = (chainId: number): UniswapRepository => {
    // Get the config and client
    const { config, client } = getNetworkConfigAndClient(chainId);

    return {
        // Get the amount out of uniswap
        getAmountOut: async (params: {
            amount: bigint;
            minAmount?: bigint;
            fromToken: Address;
            toToken: Address;
        }): Promise<{ dstAmount: bigint; minDstAmount: bigint }> => {
            // If amount === minAmount, do a single call, otherwise, do a multicall
            if (
                params.minAmount === undefined ||
                params.amount === params.minAmount
            ) {
                // Get the quote swap result
                const getAmountsOutResult = await client.readContract({
                    address: config.getContractAddress('uniswapV2Router02'),
                    abi: iUniswapV2Router02ABI,
                    functionName: 'getAmountsOut',
                    args: [params.amount, [params.fromToken, params.toToken]],
                });
                // Ensure we got our data
                const dstAmount = getAmountsOutResult[1];
                if (!dstAmount) throw new Error('Unable to get amount out');

                // Format the output
                return {
                    dstAmount: dstAmount,
                    minDstAmount:
                        (dstAmount * BigInt(100 - ONE_INCH_SLIPPAGE)) / 100n,
                };
            }

            // Otherwise, perform the multicall
            const getAmountsOutMulticallParams = [
                {
                    amount: params.amount,
                    tokens: [params.fromToken, params.toToken],
                },
                {
                    amount: params.minAmount,
                    tokens: [params.fromToken, params.toToken],
                },
            ];
            const getAmountsOutMulticallResult = await client.multicall({
                contracts: getAmountsOutMulticallParams.map((param) => ({
                    address: config.getContractAddress('uniswapV2Router02'),
                    abi: iUniswapV2Router02ABI,
                    functionName: 'getAmountsOut',
                    args: [param.amount, param.tokens],
                })),
                allowFailure: false,
            });

            // Extract our params
            const dstAmount = getAmountsOutMulticallResult[0]?.[1];
            const tmpDstAmount = getAmountsOutMulticallResult[1]?.[1];

            // Ensure we have the data
            if (dstAmount === undefined || tmpDstAmount === undefined) {
                throw new Error('Unable to get quotations');
            }

            // Format the output
            return {
                dstAmount: dstAmount,
                minDstAmount:
                    (tmpDstAmount * BigInt(100 - ONE_INCH_SLIPPAGE)) / 100n,
            };
        },
    };
};
