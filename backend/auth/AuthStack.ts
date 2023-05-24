import { ContractApiGatewayRoute } from '@cashmere-monorepo/backend-core/contracts';
import { CoreStack } from '@cashmere-monorepo/backend-core/stacks/CoreStack';
import {
    loginContract,
    logoutContract,
    nonceContract,
    refreshContract,
} from '@cashmere-monorepo/shared-contract-auth';
import {
    Api,
    ApiAuthorizer,
    Config,
    Function,
    Stack,
    StackContext,
    use,
} from 'sst/constructs';

const path = './backend/functions/auth/src';

/**
 * Build our authentication stack
 * @param stack
 * @constructor
 */
export function AuthStack({ stack }: StackContext) {
    // Bind JWT secrets
    const JWT_ACCESS_SECRET = new Config.Secret(stack, 'JWT_ACCESS_SECRET');
    const JWT_REFRESH_SECRET = new Config.Secret(stack, 'JWT_REFRESH_SECRET');
    stack.addDefaultFunctionBinding([JWT_ACCESS_SECRET, JWT_REFRESH_SECRET]);

    // Build our access token authorizer
    const accessTokenAuthorizer = getAccessTokenAuthorizer(stack);

    // Build our swap param's API
    const api = new Api(stack, 'AuthApi', {
        // Domain name configuration, when domain name will be on route53
        customDomain: use(CoreStack).getDomainPath('auth'),
        // Authorizer for the API
        authorizers: {
            accessTokenAuthorizer,
            refreshTokenAuthorizer: getRefreshTokenAuthorizer(stack),
        },
    });

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
            undefined,
            {
                authorizer: 'accessTokenAuthorizer',
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
            refreshContract,
            undefined,
            {
                authorizer: 'refreshTokenAuthorizer',
            }
        )
    );

    // Add the outputs to our stack
    stack.addOutputs({
        AuthEndpoint: api.url,
        AccessTokenAuthorizerName: accessTokenAuthorizer.name,
    });

    // Return a reference to our authorizers
    return {
        accessTokenAuthorizer,
    };
}

// Build an access token authorizer object
export const getAccessTokenAuthorizer = (stack: Stack): ApiAuthorizer => ({
    type: 'lambda',
    function: new Function(stack, 'AccessTokenAuthorizer', {
        handler: `${path}/authorizers.accessTokenHandler`,
    }),
});

// Build a refresh token authorizer object
export const getRefreshTokenAuthorizer = (stack: Stack): ApiAuthorizer => ({
    type: 'lambda',
    function: new Function(stack, 'RefreshTokenAuthorizer', {
        handler: `${path}/authorizers.refreshTokenHandler`,
    }),
});
