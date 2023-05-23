import { getUserRepository } from '@cashmere-monorepo/backend-database';
import { verifyAccessToken } from '../tokens';

/**
 * Logout endpoint
 * @param accessToken
 */
export async function logout(accessToken: string) {
    // Verify the access token and get the address from its payload
    const {
        payload: { sub: address },
    } = verifyAccessToken(accessToken);
    // Remove the refresh token hash from the database
    await (
        await getUserRepository()
    ).updateRefreshTokenHash(address, 'invalid hash');
}
