import {
    ConflictError,
    getFromCache,
    setInCache,
} from '@cashmere-monorepo/backend-core';
import { randomUUID } from 'crypto';

/**
 * Generate a new nonce for a login request
 * @param requestId
 */
export async function generateNewNonce(requestId: string) {
    // Generate a random string from a UUID (SIWE nonce may not contain dashes)
    const nonce = randomUUID().replace(/-/g, '');
    // Generate a cache key
    const key = `nonce:${requestId}`;
    // Throw an error if the request ID is reused
    if ((await getFromCache(key))?.value)
        throw new ConflictError('Duplicate request ID');
    // Store the nonce in cache for 1 minute
    await setInCache(key, nonce, 60 * 1000); // 1 minute

    return {
        nonce,
    };
}
