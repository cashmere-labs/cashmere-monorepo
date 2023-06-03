import { logger, runInMutex } from '@cashmere-monorepo/backend-core';
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
    const handleNewTx = async (tx: NewBatchedTx) => {
        // Check if we don't have a tx in queue with the same security hash
        const hasTxWithSecurityHash =
            await batchedTxRepository.hasTxWithSecurityHash(tx.securityHash);

        // If we have one, we can stop here
        if (hasTxWithSecurityHash) {
            logger.warn(
                { tx },
                'We already have a tx in queue with the same security hash in queue, we can stop here'
            );
            return;
        }

        // Otherwise, we can add it to the queue
        await batchedTxRepository.create(tx);
    };

    /**
     * Send batched tx for a chain
     * @param chainId
     */
    const sendBatchedTx = async (chainId: number) =>
        runInMutex(chainId, async () => {
            // Get the txs to send
            const txs = await batchedTxRepository.getPendingTxForChain(chainId);

            // If we don't have any txs to send, we can stop here
            if (!txs.length) {
                logger.info(
                    { chainId },
                    "We don't have any txs to send, we can stop here"
                );
                return;
            }

            // TODO: Send the txs
            // TODO: Estimate gas, simulate tx, cumulate all the gas price, ensure it fit's the max gas price, send the txs
        });

    // Return our service
    return {
        handleNewTx,
        sendBatchedTx,
    };
};
