import { MultiContractsApiGatewayRoute } from '@cashmere-monorepo/backend-core';
import { CoreStack } from '@cashmere-monorepo/backend-core/stacks/CoreStack';
import { swapParamsApiContracts } from '@cashmere-monorepo/shared-contract-swap-params';
import { Api, StackContext, use } from 'sst/constructs';

const path = './backend/functions/swap-params/src';

export function SwapParamsStack({ stack }: StackContext) {
    // Build our swap param's API
    const api = new Api(stack, 'SwapApi', {
        // Domain name configuration, when domain name will be on route53
        customDomain: use(CoreStack).getDomainPath('swap'),
    });

    // Add the contract routes
    MultiContractsApiGatewayRoute(stack, api, swapParamsApiContracts, {
        estimateSwapContract: {
            handler: `${path}/handlers/estimate-swap-params.handler`,
        },
        swapParamsContract: {
            handler: `${path}/handlers/get-swap-params.handler`,
        },
    });

    // Add the outputs to our stack
    stack.addOutputs({
        SwapParamsEndpoint: api.url,
    });
}
