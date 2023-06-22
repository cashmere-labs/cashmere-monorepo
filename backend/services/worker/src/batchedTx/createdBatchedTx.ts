import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { sqsClient } from '@cashmere-monorepo/backend-core';
import { Queue } from 'sst/node/queue';
import { NewBatchedTx } from './types';

/**
 * Send a new batched TX
 */
export const createBatchedTx = async (data: NewBatchedTx) => {
    // Prepare our send message command
    const command = new SendMessageCommand({
        QueueUrl: Queue.TxSenderQueue.queueUrl,
        MessageBody: JSON.stringify(data),
    });
    // Send it
    await sqsClient.send(command);
};
