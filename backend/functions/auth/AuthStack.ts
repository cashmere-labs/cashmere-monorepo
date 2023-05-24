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

export function AuthStack({ stack }: StackContext) {
    // Bind JWT secrets
    const JWT_ACCESS_SECRET = new Config.Secret(stack, 'JWT_ACCESS_SECRET');
    const JWT_REFRESH_SECRET = new Config.Secret(stack, 'JWT_REFRESH_SECRET');
    stack.addDefaultFunctionBinding([JWT_ACCESS_SECRET, JWT_REFRESH_SECRET]);

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
        authorizers: {
            accessTokenAuthorizer: getAccessTokenAuthorizer(stack, false),
            refreshTokenAuthorizer: getRefreshTokenAuthorizer(stack, false),
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
            'accessTokenAuthorizer'
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
            'refreshTokenAuthorizer'
        )
    );

    // Add the outputs to our stack
    stack.addOutputs({
        AuthEndpoint: api.url,
    });
}

// Build an access token authorizer object
export function getAccessTokenAuthorizer(
    stack: Stack,
    bindSecret = true
): ApiAuthorizer {
    return {
        type: 'lambda',
        function: new Function(stack, 'AccessTokenAuthorizer', {
            functionName: 'accessTokenAuthorizerFunction',
            handler: `${path}/authorizers.accessTokenHandler`,
            bind: bindSecret
                ? [new Config.Secret(stack, 'JWT_ACCESS_SECRET')]
                : undefined,
        }),
    };
}

// Build a refresh token authorizer object
export function getRefreshTokenAuthorizer(
    stack: Stack,
    bindSecret = true
): ApiAuthorizer {
    return {
        type: 'lambda',
        function: new Function(stack, 'RefreshTokenAuthorizer', {
            functionName: 'refreshTokenAuthorizerFunction',
            handler: `${path}/authorizers.refreshTokenHandler`,
            bind: bindSecret
                ? [new Config.Secret(stack, 'JWT_REFRESH_SECRET')]
                : undefined,
        }),
    };
}
