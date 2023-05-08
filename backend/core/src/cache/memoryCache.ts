// Params to get or set a value from our memoryCache
import { createHash } from 'node:crypto';

export type GetOrSetFromCacheParams = {
    key: string | unknown;
    neverExpire?: boolean;
    ttl?: number;
};

// Default expiration from our memoryCache, 10minutes
const defaultTtl = 10 * 60 * 1000;

// Represent our memory memoryCache
interface CacheType {
    [key: string]:
        | {
        value: unknown;
        creation?: Date;
    }
        | undefined;
}

// Our current memoryCache instance
let memoryCache: CacheType = {};

// Get or set a value from memoryCache
export const getOrSetFromCache = async <T>(
    params: GetOrSetFromCacheParams,
    valueAccessor: () => Promise<T>,
) => {
    // Build our key hash
    let keyHash: string;
    if (typeof params.key === 'string') {
        keyHash = params.key;
    } else {
        keyHash = createHash('sha256')
            .update(JSON.stringify(params.key), 'utf8')
            .digest('hex');
    }

    // Current date
    const now = new Date();

    // Get the current value from memoryCache
    const currentCacheEntry = memoryCache[keyHash];
    if (currentCacheEntry?.value) {
        // If it never expire return it directly
        if (params.neverExpire) {
            return currentCacheEntry.value as T;
        }

        // Check if the value as expired or not, if not return it
        if (
            currentCacheEntry.creation &&
            currentCacheEntry.creation.getTime() + (params.ttl || defaultTtl) <
            now.getTime()
        ) {
            return currentCacheEntry.value as T;
        }
    }

    // If we arrived here, we need to get a new value
    const value = await valueAccessor();
    // Set the value in our memoryCache
    memoryCache[keyHash] = {
        value,
        creation: now,
    };
    // Return the new value
    return value;
};