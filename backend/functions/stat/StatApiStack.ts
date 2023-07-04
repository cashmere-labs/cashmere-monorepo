import { MultiContractsApiGatewayRoute } from '@cashmere-monorepo/backend-core/contracts/MultiContractApiGatewayRoute';

import { CoreStack } from '@cashmere-monorepo/backend-core/stacks/CoreStack';
import { statApiContracts } from '@cashmere-monorepo/shared-contract-stat';

import { Api, StackContext, use } from 'sst/constructs';

const path = './backend/functions/stat/src';

export function StatApiStack({ stack }: StackContext) {
    // Build our stat param's API
    const api = new Api(stack, 'StatApiStack', {
        // Domain name configuration, when domain name will be on route53
        customDomain: use(CoreStack).getDomainPath('stat-api'),
    });

    // Add the contract routes
    MultiContractsApiGatewayRoute(stack, api, statApiContracts, {
        healthCheckContract: {
            handler: `${path}/handlers/healthCheck.handler`,
        },
        totalSwapContract: {
            handler: `${path}/handlers/totalSwaps.handler`,
        },
        listSwapContract: {
            handler: `${path}/handlers/listSwaps.handler`,
        },
        statAllChainContract: {
            handler: `${path}/handlers/statData.handler`,
        },
        statByChainContract: {
            handler: `${path}/handlers/statByChain.handler`,
        },
    });

    // Add the outputs to our stack
    stack.addOutputs({
        StatParamsEndpoint: api.url,
    });
}
