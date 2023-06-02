import { getOrSetFromCache } from '@cashmere-monorepo/backend-core/cache/dynamoDbCache';
import { getNetworkConfigAndClient } from '@cashmere-monorepo/shared-blockchain';
import { Hex } from 'viem';

// Generic interface for our uniswap repository
export type BlockchainRepository = {
    getLastBlock: () => Promise<bigint>;
    getMaxedOutScanToBlock: (range: { from: bigint; to: bigint }) => {
        maxBlock: bigint;
    };
};

/**
 * Get the blockchain repository for the given chain
 * @param chainId
 */
export const getBlockchainRepository = (chainId: number) => {
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
        /**
         * Get the last block for the given chain
         */
        getLastBlock: () =>
            getOrSetFromCache(
                {
                    key: cacheParams('getLastSafeBlock', {}),
                    ttl: 30_000,
                },
                client.getBlockNumber
            ),

        /**
         * Get the maxed out scan to block for the given range
         * @param range
         */
        getMaxedOutScanToBlock: (range: {
            from: bigint;
            to: bigint;
        }): { maxBlock: bigint } => {
            // Get the limit for the given chain
            const limit = config.scanConfig.maxScanBlock ?? 2_000;

            // If the diff between the two blocks is superior to the limit, return the limit
            if (range.to - range.from > BigInt(limit)) {
                return { maxBlock: range.from + BigInt(limit) };
            }

            // Otherwise, return the previous toBlock
            return { maxBlock: range.to };
        },

        /**
         * Get the transaction receipt for the given tx hash
         */
        getTransactionReceipt: (txHash: Hex) =>
            getOrSetFromCache(
                {
                    key: cacheParams('getTxReceipt', { txHash }),
                    ttl: 300_000,
                },
                () => client.getTransactionReceipt({ hash: txHash })
            ),
    };
};
