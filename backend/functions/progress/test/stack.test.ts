import { AuthStack } from '@cashmere-monorepo/backend-auth/AuthStack';
import { CoreStack } from '@cashmere-monorepo/backend-core/stacks/CoreStack';
import { Template } from 'aws-cdk-lib/assertions';
import { App, getStack, use } from 'sst/constructs';
import { initProject } from 'sst/project';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { ProgressStack } from '../ProgressStack';

/**
 * Progress stat test
 */
describe('[Stack] Progress', () => {
    // The current app used to perform the test
    let app: App;

    // Before each test, init project and deploy core stack
    beforeAll(async () => {
        vi.useFakeTimers();

        // Init project and deploy core stack
        await initProject({});
        app = new App({ mode: 'deploy' });
        app.stack(CoreStack);
        app.stack(AuthStack);

        // Deploy swap stack
        app.stack(ProgressStack);
    });

    afterAll(async () => {
        vi.useRealTimers();
    });

    /**
     * Ensure all the endpoints are deployed
     */
    it("[Ok] All endpoint's deployed", () => {
        // Get the cloud formation template of the stack
        const stack = getStack(ProgressStack);
        const template = Template.fromStack(stack);

        // Ensure we got the function that list the transactions
        template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
            RouteKey: 'GET /transactionsList',
        });
        // Ensure we got the function that delete the transactions
        template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
            RouteKey: 'DELETE /transactionsList',
        });
        // Ensure we got the function that delete a transaction by it's id
        template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
            RouteKey: 'DELETE /transactionsList/:swapId',
        });
        // Ensure we got the function that get the undetected tx ids
        template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
            RouteKey: 'GET /getUndetectedTxIds',
        });

        // Ensure that the stack return the right object
        const stackOutput = use(ProgressStack);
        expect(stackOutput.httpApi).toBeDefined();
        expect(stackOutput.webSocketApi).toBeDefined();
    });
});
