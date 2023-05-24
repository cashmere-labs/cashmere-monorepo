import { getOrSetFromCache } from '@cashmere-monorepo/backend-core/cache/dynamoDbCache';
import { getNetworkConfigAndClient } from '@cashmere-monorepo/shared-blockchain';

// Generic interface for our uniswap repository
export type BlockchainRepository = {
    getLastBlock: () => Promise<bigint>;
};

/**
 * Get the blockchain repository for the given chain
 * @param chainId
 */
export const getBlockchainRepository = (
    chainId: number
): BlockchainRepository => {
    // Get the config and client
    const { config, client } = getNetworkConfigAndClient(chainId);

    // Initial for our cache entries
    const cacheParams = (method: string, params: unknown) => ({
        chainId: config.chain.id,
        repository: 'blockchainRepository',
        method,
        params,
    });

    return {
        // Get the amount out of uniswap
        getLastBlock: () =>
            getOrSetFromCache(
                {
                    key: cacheParams('getLastSafeBlock', {}),
                    ttl: 30_000,
                },
                client.getBlockNumber
            ),
    };
};
