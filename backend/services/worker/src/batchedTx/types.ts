import { Address, Hex } from 'viem';

/**
 * The new batched tx type
 */
export type NewBatchedTx = {
    chainId: number;
    priority: number;
    target: Address;
    data: Hex;
    securityHash: string;
};
