import { getOrSetFromCache } from '@cashmere-monorepo/backend-core';
import {
    cashmereAggregatorUniswapABI,
    getNetworkConfigAndClient,
    startSwapFunctionABI,
} from '@cashmere-monorepo/shared-blockchain';
import {
    Address,
    Hex,
    decodeFunctionData,
    encodeFunctionData,
    isAddressEqual,
} from 'viem';

/**
 * Get the aggregator repository on the given chain
 * @param chainId
 */
export const getAggregatorRepository = (chainId: number) => {
    // Get the config and client
    const { config, client } = getNetworkConfigAndClient(chainId);

    // Initial for our cache entries
    const cacheParams = (method: string, params: unknown) => ({
        chainId: config.chain.id,
        repository: 'aggregatorRepository',
        method,
        params,
    });

    return {
        /**
         * Get the start swap args for the given tx hash
         * @param txHash
         */
        getStartSwapArgs: (txHash: Hex) =>
            getOrSetFromCache(
                {
                    key: cacheParams('startSwapArgs', txHash),
                },
                async () => {
                    // Get the tx
                    const tx = await client.getTransaction({ hash: txHash });

                    // Decode the tx args
                    return decodeFunctionData({
                        abi: [startSwapFunctionABI],
                        data: tx.input,
                    });
                }
            ),

        /**
         * Check if the given address match the current aggregator
         */
        isContractAddress: (address: Address) =>
            isAddressEqual(address, config.getContractAddress('aggregator')),

        /**
         * Encode the continue swap function call data
         */
        encodeContinueSwapCallData: (data: { srcChainId: number; id: Hex }) => {
            // Build the function call data
            const callData = encodeFunctionData({
                abi: cashmereAggregatorUniswapABI,
                functionName: 'continueSwap',
                args: [data],
            });
            // Return generic tx info's
            return {
                target: config.getContractAddress('aggregator'),
                data: callData,
            };
        },
    };
};

export type AggregatorRepository = ReturnType<typeof getAggregatorRepository>;
