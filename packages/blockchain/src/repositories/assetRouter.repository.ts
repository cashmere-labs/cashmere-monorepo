import { Hex, pad } from 'viem';
import { assetRouterABI } from '../abis/wagmiGenerated';
import { getNetworkConfigAndClient } from '../config/blockchain.config';

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
};

// Get the asset router repository for the given chain
export const getAssetRouterRepository = (
  chainId: number,
): AssetRouterRepository => {
  // Get the config and client
  const { config, client } = getNetworkConfigAndClient(chainId);

  return {
    // Quote the swaps via our asset router
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
      const multiCallResult = await client.multicall({
        contracts: multicallParams.map(param => ({
          address: config.getContractAddress('assetRouter'),
          abi: assetRouterABI,
          functionName: 'quoteSwap',
          args: [param],
        })),
      });

      // Extract the data's
      const potentialOutcome = multiCallResult[0]?.result?.[0];
      const haircut = multiCallResult[0]?.result?.[1];
      const minPotentialOutcome = multiCallResult[1]?.result?.[0];

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
  };
};
