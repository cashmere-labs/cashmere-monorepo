import { CoreStack } from '@cashmere-monorepo/backend-core/stacks/CoreStack';
import { Template } from 'aws-cdk-lib/assertions';
import { App, getStack } from 'sst/constructs';
import { initProject } from 'sst/project';
import { beforeEach, describe, it } from 'vitest';
import { SwapParamsStack } from '../SwapParamsStack';

/**
 * Swap estimate business logic test
 */
describe('[Stack] StackParams', () => {
    // The current app used to perform the test
    let app: App;

    // Before each test, init project and deploy core stack
    beforeEach(async () => {
        // Init project and deploy core stack
        await initProject({});
        app = new App({ mode: 'deploy' });
        app.stack(CoreStack);

        // Deploy swap stack
        app.stack(SwapParamsStack);
    });

    /**
     * Ensure all the endpoints are deployed
     */
    it("All endpoint's deployed", async () => {
        // Get the cloud formation template of the stack
        const stack = getStack(SwapParamsStack);
        const template = Template.fromStack(stack);

        // Ensure lambda has the right config's
        template.hasResourceProperties('AWS::Lambda::Function', {
            MemorySize: 512,
            Timeout: 30,
        });
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
