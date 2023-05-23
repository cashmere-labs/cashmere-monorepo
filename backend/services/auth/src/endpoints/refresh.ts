import { logger } from '@cashmere-monorepo/backend-core';
import { ForbiddenError } from '@cashmere-monorepo/backend-core/src/error/ForbiddenError';
import { getUserRepository } from '@cashmere-monorepo/backend-database';
import {
    compare as pbkdf2Compare,
    hash as pbkdf2Hash,
} from 'pbkdf2-password-hash';
import { getTokens, verifyRefreshToken } from '../tokens';

/**
 * Refresh endpoint
 * @param refreshToken
 */
export async function refresh(refreshToken: string) {
    // Verify the refresh token and get the address from its payload
    const {
        payload: { sub: address },
        token,
    } = verifyRefreshToken(refreshToken);
    // Retrieve user DB repository
    const userRepository = await getUserRepository();
    // Get a user from DB
    const user = await userRepository.getByAddress(address);
    // Throw an error if the user's refresh token hash is not set
    if (!user.refreshTokenHash) throw new ForbiddenError('Access Denied');
    // Compare the provided refresh token with the one stored in DB, throw an error if they don't match
    let refreshTokenMatches = false;
    try {
        refreshTokenMatches = await pbkdf2Compare(token, user.refreshTokenHash);
    } catch (e) {
        // catch pbkdf2 error
        logger.error(
            e,
            'An error occurred while comparing the refresh token hash'
        );
    }
    if (!refreshTokenMatches) throw new ForbiddenError('Access Denied');
    // Generate new tokens
    const tokens = await getTokens(address);
    // Update the refresh token hash in DB
    await userRepository.updateRefreshTokenHash(
        address,
        await pbkdf2Hash(tokens.refreshToken)
    );

    return tokens;
}
