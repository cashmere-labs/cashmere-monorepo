import { MultiContractsApiGatewayRoute } from '@cashmere-monorepo/backend-core/contracts/MultiContractApiGatewayRoute';
import { CoreStack } from '@cashmere-monorepo/backend-core/stacks/CoreStack';
import { loginApiContracts } from '@cashmere-monorepo/shared-contract-auth';
import {
    Api,
    ApiAuthorizer,
    Config,
    Function,
    Stack,
    StackContext,
    use,
} from 'sst/constructs';

const path = './backend/auth/src';

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
    MultiContractsApiGatewayRoute(stack, api, loginApiContracts, {
        loginContract: {
            handler: `${path}/handlers/login-auth.handler`,
        },
        logoutContract: {
            handler: `${path}/handlers/logout-auth.handler`,
            routeProps: {
                authorizer: 'accessTokenAuthorizer',
            },
        },
        nonceContract: {
            handler: `${path}/handlers/nonce-auth.handler`,
        },
        refreshContract: {
            handler: `${path}/handlers/refresh-auth.handler`,
            routeProps: {
                authorizer: 'refreshTokenAuthorizer',
            },
        },
    });
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
