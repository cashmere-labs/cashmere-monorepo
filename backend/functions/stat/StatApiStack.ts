import { ContractApiGatewayRoute } from '@cashmere-monorepo/backend-core';
import { CoreStack } from '@cashmere-monorepo/backend-core/stacks/CoreStack';
import { testContract } from '@cashmere-monorepo/shared-contract-stat-params';
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
            testContract
        )
    );

    // Add the outputs to our stack
    stack.addOutputs({
        StatParamsEndpoint: api.url,
    });
}
