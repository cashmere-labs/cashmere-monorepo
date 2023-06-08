import { getBlockchainRepository } from '@cashmere-monorepo/backend-blockchain/src/repositories/blockchain.repository';
import { logger, runInMutex } from '@cashmere-monorepo/backend-core';
import { getBatchedTxRepository } from '@cashmere-monorepo/backend-database';
import { sift } from 'radash';
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

            // Get our blockchain client for the chain
            const blockchainRepository = getBlockchainRepository(chainId);

            // Get additional gas data for the given chain
            const gasFeesParam = await blockchainRepository.getGasFeesParam();

            // Get our account & private key here
            const { account, privateClient } =
                blockchainRepository.buildPrivateClient(
                    process.env.PRIVATE_KEY as string
                );

            // Prepare every tx's
            const txWithAdditionnalDataPromises = txs
                // Sort every tx by priority (highest first)
                .sort((a, b) => b.priority - a.priority)
                // Then map them with the additional data we need (gas price)
                .map(async (tx) => {
                    try {
                        // Estimate the gas for our tx
                        const gasEstimation =
                            await blockchainRepository.client.estimateGas({
                                // Tx data
                                to: tx.target,
                                data: tx.data,
                                // Account
                                account,
                                // gas fees param
                                ...gasFeesParam,
                            });

                        // Increase the estimation by 20%
                        const gasLimit = (gasEstimation * 120n) / 100n;

                        // TODO: Also simulate the tx there?

                        // Returned a formatted tx ready to be called
                        return {
                            to: tx.target,
                            data: tx.data,
                            ...gasFeesParam,
                            gasLimit,
                        };
                    } catch (err) {
                        logger.warn(
                            { err, chainId, tx },
                            'An error occurred while getting the gas price for a tx'
                        );
                        return undefined;
                    }
                });

            // Wait for all tx's to be prepared
            const txWithAdditionnalData = sift(
                await Promise.all(txWithAdditionnalDataPromises)
            );

            // TODO: Don't use the viem wrapper, and directly build our call data

            // TODO: Send the txs
            // TODO: Update each tx's calldata
        });

    // Return our service
    return {
        handleNewTx,
        sendBatchedTx,
    };
};
