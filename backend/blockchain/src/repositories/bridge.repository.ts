import { getOrSetFromCache } from '@cashmere-monorepo/backend-core';
import {
    bridgeABI,
    getNetworkConfigAndClient,
    swapMessageReceivedEventABI,
} from '@cashmere-monorepo/shared-blockchain';
import { encodeAbiParameters } from 'viem';
import { BlockRange } from '../types';

// Get the asset repository for the given chain
export const getBridgeRepository = (chainId: number) => {
    // Get the config and client
    const { config, client } = getNetworkConfigAndClient(chainId);

    // Initial for our cache entries
    const cacheParams = (method: string, params: unknown) => ({
        chainId: config.chain.id,
        repository: 'bridgeRepository',
        method,
        params,
    });

    return {
        /**
         * Get the swap fee for the given chain id
         * @param toChainId
         */
        getSwapFeeL0: async (toChainId: number): Promise<bigint> => {
            // Get the fee typle
            const feeTuple = await getOrSetFromCache(
                {
                    key: cacheParams('swapFees', toChainId),
                },
                async () => {
                    // Build our estimate fee's payload
                    const estimatePayload = encodeAbiParameters(
                        [{ type: 'bytes' }],
                        [`0x${'00'.repeat(2 + 2 + 20 + 32 + 20 + 65)}`] // uint16, uint16, address, uint256, address, (signature)
                    );

                    // Call our bridge contract's to get an estimation
                    return client.readContract({
                        address: config.getContractAddress('bridge'),
                        abi: bridgeABI,
                        functionName: 'quoteLayerZeroFee',
                        args: [toChainId, 1, estimatePayload],
                    });
                }
            );

            return feeTuple[0];
        },

        /**
         * Get all the swap message received events
         * @param range
         */
        getSwapMessageReceivedEvents: async (range: BlockRange) =>
            client.getLogs({
                address: config.getContractAddress('bridge'),
                event: swapMessageReceivedEventABI,
                ...range,
            }),
    };
};

export type BridgeRepository = ReturnType<typeof getBridgeRepository>;
