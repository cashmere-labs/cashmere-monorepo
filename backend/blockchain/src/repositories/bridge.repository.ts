import { encodeAbiParameters } from 'viem';
import { getOrSetFromCache } from '@cashmere-monorepo/backend-core';
import {
    bridgeABI,
    getNetworkConfigAndClient,
} from '@cashmere-monorepo/shared-blockchain';

export type BridgeRepository = {
    getSwapFeeL0: (toChainId: number) => Promise<bigint>;
};

// Get the asset repository for the given chain
export const getBridgeRepository = (chainId: number): BridgeRepository => {
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
        // Get the swap fee's estimation
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
    };
};
