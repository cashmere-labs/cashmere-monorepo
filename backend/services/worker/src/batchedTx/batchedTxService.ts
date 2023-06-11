import { getMultiCallRepository } from '@cashmere-monorepo/backend-blockchain';
import { getBlockchainRepository } from '@cashmere-monorepo/backend-blockchain/src/repositories/blockchain.repository';
import { logger, runInMutex } from '@cashmere-monorepo/backend-core';
import { getBatchedTxRepository } from '@cashmere-monorepo/backend-database';
import { pick } from 'radash';
import { NewBatchedTx } from './types';

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
            // Get multicall and blockchain repository
            const blockchainRepository = getBlockchainRepository(chainId);
            const multiCallRepository = getMultiCallRepository(chainId);

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

            // Prepare every tx's
            const txByPriority = txs
                // Sort every tx by priority (highest first)
                .sort((a, b) => b.priority - a.priority);

            // Get additional gas data for the given chain
            const gasFeesParam = await blockchainRepository.getGasFeesParam();

            // Send them
            const callValues = txByPriority.map((tx) =>
                pick(tx, ['target', 'data'])
            );
            const { txHash, successIdx, failedIdx } =
                await multiCallRepository.sendBatchedTx(
                    callValues,
                    gasFeesParam
                );
            logger.info(
                {
                    chainId,
                    txHash,
                    successIdx,
                    failedIdx,
                },
                'Successfully sent batched txs'
            );

            // Get all the tx handled & failed
            const txSentIds = txByPriority
                .filter((_, index) => successIdx.includes(index))
                .map((tx) => tx._id);
            const txFailedIds = txByPriority
                .filter((_, index) => failedIdx.includes(index))
                .map((tx) => tx._id);
            // Update them
            if (txSentIds.length > 0) {
                const updateResult = await batchedTxRepository.updateTxsStatus(
                    txSentIds,
                    'sent',
                    txHash
                );
                logger.debug(
                    { chainId, txCount: txSentIds.length, updateResult },
                    'Has successfully updated the sent tx'
                );
            }
            if (txFailedIds.length > 0) {
                const updateResult = await batchedTxRepository.updateTxsStatus(
                    txFailedIds,
                    'failed'
                );
                logger.debug(
                    { chainId, txCount: txFailedIds.length, updateResult },
                    'Has successfully updated the failed tx'
                );
            }
        });

    // Return our service
    return {
        handleNewTx,
        sendBatchedTx,
    };
};
