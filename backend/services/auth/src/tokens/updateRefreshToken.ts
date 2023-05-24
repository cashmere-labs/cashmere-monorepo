import { getUserRepository } from '@cashmere-monorepo/backend-database';
import { hash as pbkdf2Hash } from 'pbkdf2-password-hash';
import { Address } from 'viem';

/**
 * Update the refresh token hash in DB
 * @param address
 * @param refreshToken
 */
export async function updateRefreshToken(
    address: Address,
    refreshToken: string
) {
    await (
        await getUserRepository()
    ).updateRefreshTokenHash(address, await pbkdf2Hash(refreshToken));
}
