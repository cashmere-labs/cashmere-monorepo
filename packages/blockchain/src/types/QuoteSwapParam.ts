import { Address, Hex } from 'viem';

/**
 * Interface used to quote swap's
 */
export interface QuoteSwapParam {
  srcPoolId: number;
  dstPoolId: number;
  dstChainId: number;
  amount: bigint;
  minAmount: bigint;
  refundAddress: Address;
  to: Address;
  payload: Hex;
}
