import { Address } from 'viem';
import { getTokens, updateRefreshToken } from '../utils';

/**
 * Refresh endpoint
 * @param address
 */
export async function refresh(address: Address) {
    // Generate new tokens
    const tokens = getTokens(address);
    // Update the refresh token hash in DB
    await updateRefreshToken(address, tokens.refreshToken);

    return tokens;
}
