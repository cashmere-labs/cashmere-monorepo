import { UnauthorizedError, logger } from '@cashmere-monorepo/backend-core';
import { JwtPayload } from '../dto';
import { getAccessVerifier, getRefreshVerifier } from './jwt';

/**
 * Verify the access token and return payload
 * @param token
 */
export function verifyAccessToken(token: string): {
    payload: JwtPayload;
    token: string;
} {
    // Remove the Bearer prefix and check whether it was present, throw an error if not
    const strippedToken = token.replace(/^Bearer /, '');
    if (token === strippedToken)
        throw new UnauthorizedError('Invalid token prefix');
    // Verify the token and extract payload
    try {
        return {
            payload: getAccessVerifier()(strippedToken),
            token: strippedToken,
        };
    } catch (e) {
        logger.error(e, 'Failed to verify access token');
        throw new UnauthorizedError('Access Denied');
    }
}

/**
 * Verify the refresh token and return payload
 * @param token
 */
export function verifyRefreshToken(token: string): {
    payload: JwtPayload;
    token: string;
} {
    // Remove the Bearer prefix and check whether it was present, throw an error if not
    const strippedToken = token.replace(/^Bearer /, '');
    if (token === strippedToken)
        throw new UnauthorizedError('Invalid token prefix');
    // Verify the token and extract payload
    try {
        return {
            payload: getRefreshVerifier()(strippedToken),
            token: strippedToken,
        };
    } catch (e) {
        logger.error(e, 'Failed to verify refresh token');
        throw new UnauthorizedError('Access Denied');
    }
}
