import { getUserRepository } from '@cashmere-monorepo/backend-database';
import { compare as pbkdf2Compare } from 'pbkdf2-password-hash';
import { Address } from 'viem';

/**
 * Verify the refresh token against the hash saved in DB
 * @param address
 * @param token
 */
export async function verifyRefreshTokenAgainstDb(
    address: Address,
    token: string
) {
    // Retrieve the user from DB
    const dbUser = await (await getUserRepository()).getByAddress(address);
    // If the user or the refresh token hash is not found, return false
    if (!dbUser || !dbUser.refreshTokenHash) return false;

    // Verify the token against the hash, the function may throw an error if the hash is malformed, so catch that
    try {
        return pbkdf2Compare(token, dbUser.refreshTokenHash);
    } catch (e) {
        return false;
    }
}
