import { CoreStack } from '@cashmere-monorepo/backend-core/stacks/CoreStack';
import { Template } from 'aws-cdk-lib/assertions';
import { App, getStack } from 'sst/constructs';
import { initProject } from 'sst/project';
import { afterAll, beforeAll, describe, it, vi } from 'vitest';
import { SwapParamsStack } from '../SwapParamsStack';

/**
 * Swap estimate business logic test
 */
describe('[Stack] StackParams', () => {
    // The current app used to perform the test
    let app: App;

    // Before each test, init project and deploy core stack
    beforeAll(async () => {
        vi.useFakeTimers();

        // Init project and deploy core stack
        await initProject({});
        app = new App({ mode: 'deploy' });
        app.stack(CoreStack);

        // Deploy swap stack
        app.stack(SwapParamsStack);
    });

    afterAll(async () => {
        vi.useRealTimers();
    });

    /**
     * Ensure all the endpoints are deployed
     */
    it("[Ok] All endpoint's deployed", () => {
        // Get the cloud formation template of the stack
        const stack = getStack(SwapParamsStack);
        const template = Template.fromStack(stack);

        // Ensure we got the function we go the estimate route
        template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
            RouteKey: 'GET /estimate',
        });
        // Ensure we got the function we go the estimate route
        template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
            RouteKey: 'GET /params',
        });
    });
});
