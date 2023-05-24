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

export const accessTokenHandler = async (
    event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
    const { success, payload } = await accessAuthenticate(event);

    return {
        principalId: payload?.sub ?? 'unknown',
        policyDocument: buildPolicy(
            success ? 'Allow' : 'Deny',
            event.methodArn
        ),
        context: payload,
    };
};

const accessAuthenticate = async (
    event: APIGatewayTokenAuthorizerEvent
): Promise<{ success: boolean; payload?: JwtPayload }> => {
    try {
        const token = getTokenOrThrow(event);
        const payload: JwtPayload = getAccessVerifier()(token);
        return { success: true, payload };
    } catch (e) {
        logger.error(e);
        return { success: false };
    }
};

export const refreshTokenHandler = async (
    event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
    const { success, payload } = await refreshAuthenticate(event);

    return {
        principalId: payload?.sub ?? 'unknown',
        policyDocument: buildPolicy(
            success ? 'Allow' : 'Deny',
            event.methodArn
        ),
        context: payload,
    };
};

const refreshAuthenticate = async (
    event: APIGatewayTokenAuthorizerEvent
): Promise<{ success: boolean; payload?: JwtPayload }> => {
    try {
        const token = getTokenOrThrow(event);
        const payload: JwtPayload = getRefreshVerifier()(token);
        if (!(await verifyRefreshTokenAgainstDb(payload.sub, token)))
            return { success: false };
        return { success: true, payload };
    } catch (e) {
        logger.error(e);
        return { success: false };
    }
};

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

const getTokenOrThrow = (event: APIGatewayTokenAuthorizerEvent) => {
    const auth = event.authorizationToken || '';
    const [type, token] = auth.split(' ');
    if ((type || '').toLowerCase() !== 'bearer')
        throw new Error('Authorization header prefix is not `bearer`');
    if (!token?.length)
        throw new Error('Authorization header does not contain a token');
    return token;
};
