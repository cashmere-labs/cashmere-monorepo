import { logger, validateTypeOrThrow } from '@cashmere-monorepo/backend-core';
import { buildBatchedTxService } from '@cashmere-monorepo/backend-service-worker';
import { getSendTxQueueTypeCompiler } from '@cashmere-monorepo/shared-contract-worker';
import { SQSBatchResponse, SQSEvent } from 'aws-lambda';
import { Handler } from 'sst/context';

/**
 * The type compiler for our send tx queue
 */
const typeCompiler = getSendTxQueueTypeCompiler();

/**
 * Handler used to send TX
 */
export const handler = Handler(
    'sqs',
    async (event: SQSEvent): Promise<SQSBatchResponse> => {
        // Setup our logger
        logger.info('Send TX handler');

        // Get our batched tx service
        const batchedTxService = await buildBatchedTxService();

        // Array of all the failed items
        const failedMessageIds: string[] = [];

        // Array of the chain id handled with success
        const chainIdsHandled = new Set<number>();

        // Iterate over each records
        for (const record of event.Records) {
            // Try to handle the record
            try {
                // Parse it
                const body = validateTypeOrThrow(typeCompiler, record.body);

                // Handle it via our batched tx service
                await batchedTxService.handleNewTx(body);

                // Add the chain id to the handled list
                chainIdsHandled.add(body.chainId);
            } catch (e) {
                logger.warn(
                    { record, e },
                    'An error occurred while handling a record'
                );
                failedMessageIds.push(record.messageId);
            }
        }

        // Call the service to try to send tx on each chain (if any)
        for (const chainId of chainIdsHandled.values()) {
            try {
                await batchedTxService.sendBatchedTx(chainId);
            } catch (e) {
                logger.warn(
                    { chainId, e },
                    'An error occurred while sending batched tx for a chain'
                );
            }
        }

        // Return the failed items
        return {
            batchItemFailures: failedMessageIds.map((id) => ({
                itemIdentifier: id,
            })),
        };
    }
);
