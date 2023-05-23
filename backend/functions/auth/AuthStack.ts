import { ContractApiGatewayRoute } from '@cashmere-monorepo/backend-core/contracts';
import { CoreStack } from '@cashmere-monorepo/backend-core/stacks/CoreStack';
import {
    loginContract,
    logoutContract,
    nonceContract,
    refreshContract,
} from '@cashmere-monorepo/shared-contract-auth';
import { Api, Config, StackContext, use } from 'sst/constructs';

const path = './backend/functions/auth/src';

export function AuthStack({ stack }: StackContext) {
    // Build our swap param's API
    const api = new Api(stack, 'AuthApi', {
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
        customDomain: use(CoreStack).getDomainPath('auth'),
    });

    const JWT_ACCESS_SECRET = new Config.Secret(stack, 'JWT_ACCESS_SECRET');
    const JWT_REFRESH_SECRET = new Config.Secret(stack, 'JWT_REFRESH_SECRET');

    stack.addDefaultFunctionBinding([JWT_ACCESS_SECRET, JWT_REFRESH_SECRET]);

    // Add the contract routes
    api.addRoutes(
        stack,
        ContractApiGatewayRoute(
            `${path}/handlers/login-auth.handler`,
            loginContract
        )
    );
    api.addRoutes(
        stack,
        ContractApiGatewayRoute(
            `${path}/handlers/logout-auth.handler`,
            logoutContract,
            {
                bind: [],
            }
        )
    );
    api.addRoutes(
        stack,
        ContractApiGatewayRoute(
            `${path}/handlers/nonce-auth.handler`,
            nonceContract
        )
    );
    api.addRoutes(
        stack,
        ContractApiGatewayRoute(
            `${path}/handlers/refresh-auth.handler`,
            refreshContract
        )
    );

    // Add the outputs to our stack
    stack.addOutputs({
        AuthEndpoint: api.url,
    });
}
