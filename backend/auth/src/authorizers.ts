import { logger } from '@cashmere-monorepo/backend-core/logger/logger';
import {
    JwtPayload,
    verifyRefreshTokenAgainstDb,
} from '@cashmere-monorepo/backend-service-auth';
import {
    getAccessVerifier,
    getRefreshVerifier,
} from '@cashmere-monorepo/backend-service-auth/src/tokens/jwt';
import {
    APIGatewayAuthorizerResult,
    APIGatewayTokenAuthorizerEvent,
} from 'aws-lambda';

/**
 * Access token authorizer handler
 * @param event
 */
export const accessTokenHandler = async (
    event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
    // Authenticate the user
    const { success, payload } = await accessAuthenticate(event);

    // Return the access policy
    return {
        principalId: payload?.sub ?? 'unknown',
        policyDocument: buildPolicy(
            success ? 'Allow' : 'Deny',
            event.methodArn
        ),
        context: payload,
    };
};

/**
 * Verify and parse the access token
 * @param event
 */
const accessAuthenticate = async (
    event: APIGatewayTokenAuthorizerEvent
): Promise<{ success: boolean; payload?: JwtPayload }> => {
    try {
        // Extract a token from the event
        const token = getTokenOrThrow(event);
        // Verify the token and extract the payload
        const payload: JwtPayload = getAccessVerifier()(token);

        return { success: true, payload };
    } catch (e) {
        logger.error(e);
        return { success: false };
    }
};

/**
 * Refresh token authorizer handler
 * @param event
 */
export const refreshTokenHandler = async (
    event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
    // Authenticate the user
    const { success, payload } = await refreshAuthenticate(event);

    // Return the access policy
    return {
        principalId: payload?.sub ?? 'unknown',
        policyDocument: buildPolicy(
            success ? 'Allow' : 'Deny',
            event.methodArn
        ),
        context: payload,
    };
};

/**
 * Verify and parse the access token
 * @param event
 */
const refreshAuthenticate = async (
    event: APIGatewayTokenAuthorizerEvent
): Promise<{ success: boolean; payload?: JwtPayload }> => {
    try {
        // Extract a token from the event
        const token = getTokenOrThrow(event);
        // Verify the token and extract the payload
        const payload: JwtPayload = getRefreshVerifier()(token);

        // Verify the token against the hash saved in DB
        if (!(await verifyRefreshTokenAgainstDb(payload.sub, token)))
            return { success: false };

        return { success: true, payload };
    } catch (e) {
        logger.error(e);
        return { success: false };
    }
};

// Build a policy document for the given effect and resource
function buildPolicy(effect: string, methodArn: string) {
    return {
        Version: '2012-10-17',
        Statement: [
            {
                Action: 'execute-api:Invoke',
                Effect: effect,
                Resource: methodArn,
            },
        ],
    };
}

// Extract a token from the event
const getTokenOrThrow = (event: APIGatewayTokenAuthorizerEvent) => {
    const auth = event.authorizationToken || '';
    const [type, token] = auth.split(' ');
    if ((type || '').toLowerCase() !== 'bearer')
        throw new Error('Authorization header prefix is not `bearer`');
    if (!token?.length)
        throw new Error('Authorization header does not contain a token');
    return token;
};
