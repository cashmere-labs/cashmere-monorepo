import { CoreStack } from '@cashmere-monorepo/backend-core/stacks/CoreStack';
import { Template } from 'aws-cdk-lib/assertions';
import { App, getStack } from 'sst/constructs';
import { initProject } from 'sst/project';
import { afterAll, beforeEach, describe, it, vi } from 'vitest';
import { StatApiStack } from '../StatApiStack';
/**
 * Swap estimate business logic test
 */

describe('[Stack] StackParams', () => {
    // The current app used to perform the test
    let app: App;

    // Before each test, init project and deploy core stack
    beforeEach(async () => {
        vi.useFakeTimers();

        // Init project and deploy core stack
        await initProject({});
        app = new App({ mode: 'deploy' });
        app.stack(CoreStack as any);

        // Deploy swap stack
        app.stack(StatApiStack);
    });

    afterAll(async () => {
        vi.useRealTimers();
    });

    /**
     * Ensure all the endpoints are deployed
     */
    it("[Ok] All endpoint's deployed", async () => {
        // Get the cloud formation template of the stack
        const stack = getStack(StatApiStack);
        const template = Template.fromStack(stack as any);

        // Ensure lambda has the right config's
        template.hasResourceProperties('AWS::Lambda::Function', {
            MemorySize: 1024,
            Timeout: 900,
        });
        // Ensure we got the function we go the estimate route
        template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
            RouteKey: 'GET /health-check',
        });
        template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
            RouteKey: 'GET /list-swaps',
        });
        template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
            RouteKey: 'GET /total-swaps',
        });
    });
}, 50000000);
