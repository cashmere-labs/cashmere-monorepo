import {
    getFromCache,
    updateCacheTtlInDb,
} from '@cashmere-monorepo/backend-core';
import { Hex } from 'viem';
import { SiweMessageDto } from '../dto';
import { getTokens, updateRefreshToken, verifySiweMessage } from '../utils';

/**
 * Login endpoint
 * @param siweMessage
 * @param signature
 */
export async function login(siweMessage: SiweMessageDto, signature: Hex) {
    // Build the nonce key
    const cacheKey = `nonce:${siweMessage.requestId}`;
    // Retrieve the nonce from cache
    const nonce = (await getFromCache<string>(cacheKey))?.value;
    // Verify message
    await verifySiweMessage(siweMessage, signature, nonce);
    // Shouldn't be able to get here if verification fails, generate tokens
    const tokens = getTokens(siweMessage.address);
    // Refresh token hash in database
    await updateRefreshToken(siweMessage.address, tokens.refreshToken);
    // Invalidate nonce in cache
    await updateCacheTtlInDb(cacheKey, 0);
    // Return tokens
    return tokens;
}
