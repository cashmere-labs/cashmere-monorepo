import { getNetworkConfig } from '../config/blockchain.config';

/**
 * Get the L0 chain id from the given chain id
 * @param chainId
 */
export const getL0ChainFromChainId = (chainId: number): number => {
  const config = getNetworkConfig(chainId);
  return parseInt(config.l0ChainId);
};
