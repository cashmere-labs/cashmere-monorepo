import { getOrSetFromCache } from '@cashmere-monorepo/backend-core';
import {
    erc20ABI,
    getNetworkConfigAndClient,
} from '@cashmere-monorepo/shared-blockchain';
import { getAddress } from 'viem';
import { isPlaceholderToken } from '../utils';

export type AssetRepository = {
    tokenSymbol: (address: string) => Promise<string>;
    tokenDecimal: (address: string) => Promise<number>;
};

/**
 * Get the asset repository on the given chain
 * @param chainId
 */
export const getAssetRepository = (chainId: number): AssetRepository => {
    // Get the config and client
    const { config, client } = getNetworkConfigAndClient(chainId);

    // Initial for our cache entries
    const cacheParams = (method: string, params: unknown) => ({
        chainId: config.chain.id,
        repository: 'assetRepository',
        method,
        params,
    });

    return {
        // Get the token decimals (from cache of from blockchain
        tokenDecimal: (address: string): Promise<number> =>
            getOrSetFromCache(
                {
                    key: cacheParams('tokenDecimal', address),
                    neverExpire: true,
                },
                async () =>
                    isPlaceholderToken(getAddress(address))
                        ? client.chain!.nativeCurrency.decimals
                        : client.readContract({
                              address: getAddress(address),
                              abi: erc20ABI,
                              functionName: 'decimals',
                          })
            ),
        // Get the token name
        tokenSymbol: (address: string): Promise<string> =>
            getOrSetFromCache(
                {
                    key: cacheParams('tokenSymbol', address),
                    neverExpire: true,
                },
                async () =>
                    isPlaceholderToken(getAddress(address))
                        ? client.chain!.nativeCurrency.symbol
                        : client.readContract({
                              address: getAddress(address),
                              abi: erc20ABI,
                              functionName: 'symbol',
                          })
            ),
    };
};
