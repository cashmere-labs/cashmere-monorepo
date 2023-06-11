import { getOrSetFromCache } from '@cashmere-monorepo/backend-core';
import {
    POLYGON_ZK_TESTNET_CHAIN_ID,
    getNetworkConfigAndClient,
} from '@cashmere-monorepo/shared-blockchain';
import 'abitype'; // fix getBlockchainRepository type inference error
import { Hex, parseGwei } from 'viem';
import { GasParam } from '../types';

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

    // Get the latest block
    const getLatestBlock = async () =>
        getOrSetFromCache(
            {
                key: cacheParams('getLatestBlock', {}),
                ttl: 30_000,
            },
            client.getBlock
        );

    return {
        config,
        client,

        /**
         * Get the last block for the given chain
         */
        getLastBlockNumber: () =>
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

        /**
         * Get the gas fees param for the given chain
         */
        getGasFeesParam: async (): Promise<GasParam> =>
            getOrSetFromCache(
                {
                    key: cacheParams('getGasFeesParam', {}),
                    ttl: 30_000,
                },
                async () => {
                    // Build additional gas param
                    const latestBlock = await getLatestBlock();
                    if (latestBlock.baseFeePerGas) {
                        // In case of EIP-1559 fees (Same as prepare request from viem, but with 2x multiplier instead of 1.2x, required for mumbai:
                        // https://github.com/wagmi-dev/viem/blob/5539f3515e37637347b242ec5a24115c6a960c7d/src/utils/transaction/prepareRequest.ts#L91
                        const maxPriorityFeePerGas = parseGwei('1.5');
                        const maxFeePerGas =
                            (latestBlock.baseFeePerGas * 200n) / 100n +
                            maxPriorityFeePerGas;
                        return {
                            maxPriorityFeePerGas,
                            maxFeePerGas,
                            gasLimit: latestBlock.gasLimit,
                        };
                    } else if (
                        config.chain.id !==
                        parseInt(POLYGON_ZK_TESTNET_CHAIN_ID)
                    ) {
                        // In case of legacy tx (and not polygon ZK one)
                        const gasPrice = await client.getGasPrice();
                        return { gasPrice, gasLimit: latestBlock.gasLimit };
                    } else return { gasLimit: latestBlock.gasLimit };
                }
            ),
    };
};
