import { Cron, Queue, StackContext } from 'sst/constructs';

const path = './backend/functions/worker/src';

export function WorkerStack({ stack }: StackContext) {
    // Increase timeout and memory for every function (for better // processing)
    stack.setDefaultFunctionProps({
        timeout: '5 minutes',
        memorySize: '1 GB',
    });

    // Build the TX Sender sqs queue's
    const txSenderQueue = new Queue(stack, 'TxSenderQueue', {
        consumer: `${path}/handlers/send_tx.handler`,
        // TODO: CDK definition for batching window, batching item etc
    });

    // Build the bridge cron job's, running every minutes, with a dynamo mutex per chain to prevent concurrent iteration
    const bridgeCron = new Cron(stack, 'BridgeQueue', {
        job: `${path}/handlers/bridge.handler`,
        schedule: 'rate(1 minute)',
        // TODO: CDK definition for batching window, batching item etc
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
