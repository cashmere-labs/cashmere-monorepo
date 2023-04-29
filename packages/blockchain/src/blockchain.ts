import { BlockchainService } from './blockchain.service';

// Our current blockchain service
let currentBlockchainService: BlockchainService | undefined = undefined;

// Get the current instance of our blockchain service
export const getBlockchainService = (): BlockchainService => {
  // If we got it in cache, return it
  if (currentBlockchainService) return currentBlockchainService;

  // Otherwise, build a new one
  const newBlockchainService = new BlockchainService();
  currentBlockchainService = newBlockchainService;

  return newBlockchainService;
};
