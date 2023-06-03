import { getBatchedTxRepository } from '@cashmere-monorepo/backend-database';
import { Address, Hex } from 'viem';

/**
 * The new batched tx type
 */
type NewBatchedTx = {
    chainId: number;
    priority: number;
    target: Address;
    data: Hex;
    securityHash: string;
};

/**
 * Build our batched tx service
 */
export const buildBatchedTxService = async () => {
    // Get our batched tx database
    const batchedTxRepository = await getBatchedTxRepository();

    /**
     * Handle a new tx
     * @param tx
     */
    const handleNewTx = async (tx: NewBatchedTx) => {};

    /**
     * Send batched tx for a chain
     * @param chainId
     */
    const sendBatchedTx = async (chainId: number) => {};

    // Return our service
    return {
        handleNewTx,
        sendBatchedTx,
    };
};
