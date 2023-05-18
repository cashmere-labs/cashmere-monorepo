import { ContractApiGatewayRoute } from '@cashmere-monorepo/backend-core/contracts';
import { CoreStack } from '@cashmere-monorepo/backend-core/stacks/CoreStack';
import { estimateSwapContract } from '@cashmere-monorepo/shared-contract-swap-params';
import { Api, StackContext, use } from 'sst/constructs';

const path = './backend/functions/swap-params/src';

export function SwapParamsStack({ stack }: StackContext) {
    // Build our swap param's API
    const api = new Api(stack, 'SwapApi', {
        // Default prop's for every routes
        defaults: {
            function: {
                // Default timeout to 30seconds
                timeout: '30 seconds',
                // Default memory to 512MB
                memorySize: '512 MB',
            },
        },
        // TODO: Domain name configuration, when domain name will be on route53
        customDomain: use(CoreStack).getDomainPath('swap'),
    });

    // Add the contract routes
    api.addRoutes(
        stack,
        ContractApiGatewayRoute(
            `${path}/handlers/estimate-swap-params.handler`,
            estimateSwapContract
        )
    );

    // Add the outputs to our stack
    stack.addOutputs({
        SwapParamsEndpoint: api.url,
    });
}
