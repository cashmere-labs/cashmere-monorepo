import { Duration } from 'aws-cdk-lib';
import { Cron, Queue, StackContext } from 'sst/constructs';

const path = './backend/functions/worker/src';

export function WorkerStack({ stack }: StackContext) {
    // Increase timeout and memory for every function (for better // processing)
    stack.setDefaultFunctionProps({
        timeout: '5 minutes',
        memorySize: '1 GB',
        runtime: 'nodejs18.x',
    });

    // Build the TX Sender sqs queue's
    const txSenderQueue = new Queue(stack, 'TxSenderQueue', {
        consumer: {
            function: `${path}/handlers/send_tx.handler`,
            cdk: {
                eventSource: {
                    maxConcurrency: 5, // We can increase it needed, since we are using a mutex per chain to send tx's
                    maxBatchingWindow: Duration.seconds(10), // Only allow 10 sec of batching window, reduce if needed
                    batchSize: 100, // Max tx we can save & process per exec
                },
            },
        },
        cdk: {
            queue: {
                retentionPeriod: Duration.days(7),
                visibilityTimeout: Duration.minutes(5 * 6).plus(
                    Duration.seconds(10)
                ), // 6 x timout + batching window
            },
        },
        // TODO: CDK definition for batching window, batching item etc
    });

    // Build the bridge cron job's, running every minutes, with a dynamo mutex per chain to prevent concurrent iteration
    const bridgeCron = new Cron(stack, 'BridgeQueue', {
        job: `${path}/handlers/bridge.handler`,
        schedule: 'rate(2 minute)',
    });

    // Build the supervisor cron
    const supervisorCron = new Cron(stack, 'SupervisorCron', {
        job: `${path}/handlers/supervisor.handler`,
        schedule: 'rate(5 minute)',
    });

    // Add outputs to our stack
    stack.addOutputs({
        TxSenderQueueUrl: txSenderQueue.queueUrl,
        TxSenderQueueId: txSenderQueue.id,
        BridgeCronId: bridgeCron.id,
        SupervisorCronId: supervisorCron.id,
    });

    // Return the function's built
    return { txSenderQueue, bridgeCron, supervisorCron };
}
