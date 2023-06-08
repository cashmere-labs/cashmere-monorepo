import { getNetworkConfig } from '@cashmere-monorepo/shared-blockchain';

/**
 * Get the L0 chain id from the given chain id
 * @param chainId
 */
export const getL0ChainFromChainId = (chainId: number): number =>
    getNetworkConfig(chainId).l0ChainId;
