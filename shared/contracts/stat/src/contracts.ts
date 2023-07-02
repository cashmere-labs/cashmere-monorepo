import { healthCheckContract } from './healthCheck';
import { listSwapContract } from './listSwaps';
import { statAllChainContract } from './statAllChain';
import { statByChainContract } from './statByChain';
import { totalSwapContract } from './totalSwaps';

/**
 * The contracts for the stat API
 */
export const statApiContracts = {
    healthCheckContract,
    totalSwapContract,
    listSwapContract,
    statAllChainContract,
    statByChainContract,
};
