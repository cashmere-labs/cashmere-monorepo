import { CoreStack } from '@cashmere-monorepo/backend-core/stacks/CoreStack';
import { Template } from 'aws-cdk-lib/assertions';
import { App, getStack, use } from 'sst/constructs';
import { initProject } from 'sst/project';
import { beforeAll, describe, expect, it } from 'vitest';
import { WorkerStack } from '../WorkerStack';

/**
 * Worker stack test
 */
describe('[Stack] Worker', () => {
    // The current app used to perform the test
    let app: App;

    // Before each test, init project and deploy core stack
    beforeAll(async () => {
        // Init project and deploy core stack
        await initProject({ stage: 'test' });
        app = new App({ mode: 'deploy' });
        app.stack(CoreStack);

        // Deploy swap stack
        app.stack(WorkerStack);
    });

    /**
     * Ensure all the service are deployed
     */
    it('[Ok] All services are deployed', async () => {
        // Get the cloud formation template of the stack
        const stack = getStack(WorkerStack);
        const template = Template.fromStack(stack);

        // Expect to have a cron running every 2 minutes
        template.hasResourceProperties('AWS::Events::Rule', {
            ScheduleExpression: 'rate(2 minutes)',
        });
        // Expect to have a cron running every 5 minutes
        template.hasResourceProperties('AWS::Events::Rule', {
            ScheduleExpression: 'rate(5 minutes)',
        });

        // Has all the output's we want
        template.hasOutput('TxSenderQueueUrl', {});
        template.hasOutput('TxSenderQueueId', {});
        template.hasOutput('BridgeCronId', {});
        template.hasOutput('SupervisorCronId', {});

        // Get the stack output
        const stackOutput = use(WorkerStack);
        expect(stackOutput).toBeDefined();
        expect(stackOutput.supervisorCron).toBeDefined();
        expect(stackOutput.bridgeCron).toBeDefined();
        expect(stackOutput.txSenderQueue).toBeDefined();
    });
});
