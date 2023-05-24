import { getUserRepository } from '@cashmere-monorepo/backend-database';
import { hash as pbkdf2Hash } from 'pbkdf2-password-hash';
import { Address } from 'viem';
import { getTokens } from '../tokens';

/**
 * Refresh endpoint
 * @param address
 */
export async function refresh(address: Address) {
    // Retrieve user DB repository
    const userRepository = await getUserRepository();
    // Generate new tokens
    const tokens = await getTokens(address);
    // Update the refresh token hash in DB
    await userRepository.updateRefreshTokenHash(
        address,
        await pbkdf2Hash(tokens.refreshToken)
    );

    return tokens;
}
