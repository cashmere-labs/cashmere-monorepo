import { Template } from 'aws-cdk-lib/assertions';
import { App, getStack } from 'sst/constructs';
import { initProject } from 'sst/project';
import { describe, expect, it } from 'vitest';
import { WorkerStack } from '../WorkerStack';

describe('WorkerStack', () => {
    it('should be defined', () => {
        expect(WorkerStack).toBeDefined();
    });

    it('should create WorkerStack', async () => {
        await initProject({});
        const app = new App({ mode: 'deploy' });

        // WHEN
        app.stack(WorkerStack);

        // THEN
        const template = Template.fromStack(getStack(WorkerStack));
        template.hasResourceProperties('AWS::Lambda::Function', {
            Timeout: 300,
            MemorySize: 1024,
        });

        template.hasResourceProperties('AWS::SQS::Queue', {
            VisibilityTimeout: 1810,
            MessageRetentionPeriod: 604800,
            QueueName: 'dev-my-app-TxSenderQueue',
        });

        template.hasResourceProperties('AWS::Events::Rule', {
            ScheduleExpression: 'rate(2 minutes)',
        });

        template.hasResourceProperties('AWS::Events::Rule', {
            ScheduleExpression: 'rate(5 minutes)',
        });
        template.hasOutput('TxSenderQueueUrl', {});
        template.hasOutput('TxSenderQueueId', {});
        template.hasOutput('BridgeCronId', {});
        template.hasOutput('SupervisorCronId', {});
    });
});
