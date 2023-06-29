import { ContractApiGatewayRoute } from '@cashmere-monorepo/backend-core';
import { CoreStack } from '@cashmere-monorepo/backend-core/stacks/CoreStack';
import {
    healthCheckContract,
    listSwapContract,
    statAllChainContract,
    statByChainContract,
    totalSwapContract,
} from '@cashmere-monorepo/shared-contract-stat-params';
import { Api, StackContext, use } from 'sst/constructs';

const path = './backend/functions/stat/src';

export function StatApiStack({ stack }: StackContext) {
    // Build our stat param's API
    const api = new Api(stack, 'StatApiStack', {
        // Domain name configuration, when domain name will be on route53
        customDomain: use(CoreStack).getDomainPath('stat-api'),
    });

    // Add the health check route
    api.addRoutes(
        stack,
        ContractApiGatewayRoute(
            `${path}/handlers/healthCheck.handler`,
            healthCheckContract
        )
    );

    // Add the total swaps route
    api.addRoutes(
        stack,
        ContractApiGatewayRoute(
            `${path}/handlers/totalSwaps.handler`,
            totalSwapContract
        )
    );

    // Add the list swaps route
    api.addRoutes(
        stack,
        ContractApiGatewayRoute(
            `${path}/handlers/listSwaps.handler`,
            listSwapContract
        )
    );

    // Add the stat for all chain route
    api.addRoutes(
        stack,
        ContractApiGatewayRoute(
            `${path}/handlers/statData.handler`,
            statAllChainContract
        )
    );

    // Add the stat by chain route
    api.addRoutes(
        stack,
        ContractApiGatewayRoute(
            `${path}/handlers/statByChain.handler`,
            statByChainContract
        )
    );

    // Add the outputs to our stack
    stack.addOutputs({
        StatParamsEndpoint: api.url,
    });
}
