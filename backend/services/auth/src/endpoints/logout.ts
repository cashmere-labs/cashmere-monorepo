import { getUserRepository } from '@cashmere-monorepo/backend-database';
import { Address } from 'viem';

/**
 * Logout endpoint
 * @param address
 */
export async function logout(address: Address) {
    // Remove the refresh token hash from the database
    await (
        await getUserRepository()
    ).updateRefreshTokenHash(address, 'invalid hash');
}
