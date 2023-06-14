import { getOrSetFromCache } from '@cashmere-monorepo/backend-core';
import {
    assetRouterABI,
    crossChainSwapInitiatedEventABI,
    CrossChainSwapInitiatedLogType,
    getNetworkConfigAndClient,
    iAssetV2ABI,
} from '@cashmere-monorepo/shared-blockchain';
import { Address, getAddress, Hex, pad } from 'viem';
import { BlockRange } from '../types';

// Generic types for our asset router repository
export type AssetRouterRepository = {
    quoteSwaps: (params: {
        lwsAssetId: number;
        hgsAssetId: number;
        dstChainId: number;
        amount: bigint;
        minAmount: bigint;
    }) => Promise<{
        potentialOutcome: bigint;
        minPotentialOutcome: bigint;
        haircut: bigint;
    }>;
    getPoolTokenAsset: (poolId: number) => Promise<Address>;
};

// Get the asset router repository for the given chain
export const getAssetRouterRepository = (chainId: number) => {
    // Get the config and client
    const { config, client } = getNetworkConfigAndClient(chainId);

    // Initial for our cache entries
    const cacheParams = (method: string, params: unknown) => ({
        chainId: config.chain.id,
        repository: 'assetRouterRepository',
        method,
        params,
    });

    /**
     * Get the pool token asset for the given pool id
     * @param poolId
     */
    const getPool = (poolId: number) =>
        getOrSetFromCache(
            {
                key: cacheParams('getPool', poolId),
                neverExpire: true,
            },
            () =>
                client.readContract({
                    address: config.getContractAddress('assetRouter'),
                    abi: assetRouterABI,
                    functionName: 'getPool',
                    args: [poolId],
                })
        );

    return {
        /**
         * Quote a swap from the given params
         * @param params
         */
        quoteSwaps: async (params: {
            lwsAssetId: number;
            hgsAssetId: number;
            dstChainId: number;
            amount: bigint;
            minAmount: bigint;
        }): Promise<{
            potentialOutcome: bigint;
            minPotentialOutcome: bigint;
            haircut: bigint;
        }> => {
            // Prepare our base call args
            const baseCallArgs = {
                srcPoolId: params.lwsAssetId,
                dstPoolId: params.hgsAssetId,
                dstChainId: params.dstChainId,
                minAmount: 0n,
                refundAddress: pad('0x00', { size: 20 }),
                to: pad('0x00', { size: 20 }),
                payload: '0x00' as Hex,
            };

            // If amount === minAmount, do a single call, otherwise, do a multicall
            if (params.amount === params.minAmount) {
                // Get the quote swap result
                const quoteSwapResult = await client.readContract({
                    address: config.getContractAddress('assetRouter'),
                    abi: assetRouterABI,
                    functionName: 'quoteSwap',
                    args: [{ ...baseCallArgs, amount: params.amount }],
                });

                // Format the output
                return {
                    potentialOutcome: quoteSwapResult[0],
                    minPotentialOutcome: quoteSwapResult[0],
                    haircut: quoteSwapResult[1],
                };
            }

            // Perform the multicall for amount and minAmount
            const multicallParams = [
                { ...baseCallArgs, amount: params.amount },
                { ...baseCallArgs, amount: params.minAmount },
            ];
            const multiCallResult = (await client.multicall({
                contracts: multicallParams.map((param) => ({
                    address: config.getContractAddress('assetRouter'),
                    abi: assetRouterABI,
                    functionName: 'quoteSwap',
                    args: [param],
                })),
                allowFailure: false,
            })) as any[][];

            // Extract the data's
            const potentialOutcome = multiCallResult[0]?.[0];
            const haircut = multiCallResult[0]?.[1];
            const minPotentialOutcome = multiCallResult[1]?.[0];

            // Ensure we have the data
            if (
                potentialOutcome === undefined ||
                haircut === undefined ||
                minPotentialOutcome === undefined
            ) {
                throw new Error('Unable to get quotations');
            }

            // Format the output
            return {
                potentialOutcome: potentialOutcome,
                minPotentialOutcome: minPotentialOutcome,
                haircut: haircut,
            };
        },

        /**
         * Get the pool token asset for the given pool id
         * @param poolId
         */
        getPoolTokenAsset: async (poolId: number): Promise<Address> => {
            const pool = await getPool(poolId);

            // Then get the asset contract token from the pool
            return getOrSetFromCache(
                {
                    key: cacheParams('getPoolAssets', pool.poolAddress),
                },
                async () =>
                    client.readContract({
                        address: getAddress(pool.poolAddress),
                        abi: iAssetV2ABI,
                        functionName: 'token',
                    })
            );
        },

        /**
         * Get all the swap initiated event's
         * @param range
         */
        getSwapInitiatedEvents: (
            range: BlockRange
        ): Promise<CrossChainSwapInitiatedLogType[]> =>
            client.getLogs({
                address: config.getContractAddress('assetRouter'),
                event: crossChainSwapInitiatedEventABI,
                ...range,
            }),
    };
};
