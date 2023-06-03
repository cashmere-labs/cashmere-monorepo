// Params to get or set a value from our dynamoDbCache
import { GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { createHash } from 'node:crypto';
import { Table } from 'sst/node/table';
import { logger } from '../logger/logger';
import { dynamoDbClient } from '../utils';

// Default expiration from our dynamoDbCache, 10minutes
const defaultTtl = 10 * 60 * 1000;

// When a value shouldn't expire, we prolonged it of 24hr each time it's accessed
const neverExpireProlongationTtl = 24 * 60 * 60;

// Prolongation threshold of the ttl (1hr)
const prolongationThreshold = 60 * 60;

/**
 * Gets a value in our cache dynamo table
 */
export const getFromCache = async <T>(
    key: string
): Promise<{ value: T; ttl: number } | undefined> => {
    try {
        logger.debug({ key }, 'Trying to fetch a value from the cache');
        // Get the item from our dynamo db
        const getItemCommand = new GetItemCommand({
            TableName: Table.CachingDynamo.tableName,
            Key: { id: { S: key } },
        });
        const dynamoItem = await dynamoDbClient.send(getItemCommand);
        // If no item found, return undefined
        if (!dynamoItem?.Item?.value?.S) {
            return undefined;
        }
        // Otherwise, try to parse the value
        const value = JSON.parse(dynamoItem.Item.value.S) as T;
        const ttl = parseInt(dynamoItem.Item.ttl.N ?? '0');
        return { value, ttl };
    } catch (error) {
        logger.error(
            error,
            'Unable to perform the get query from the dynamo db cache'
        );
        throw error;
    }
};

/**
 * Sets a value in misc dynamo db
 */
export const setInCache = async (
    key: string,
    value: unknown,
    ttl: number = defaultTtl
) => {
    try {
        logger.debug({ key, value, ttl }, 'Setting a new value in the cache');
        const updateItemCommand = new UpdateItemCommand({
            TableName: Table.CachingDynamo.tableName,
            Key: { id: { S: key } },
            AttributeUpdates: {
                value: {
                    Action: 'PUT',
                    Value: { S: JSON.stringify(value) },
                },
                ttl: {
                    Action: 'PUT',
                    Value: { N: (Date.now() / 1000 + ttl).toString() },
                },
            },
            ReturnValues: 'NONE',
        });
        await dynamoDbClient.send(updateItemCommand);
    } catch (error) {
        logger.error(error, 'Unable to set the new value in the cache');
        throw error;
    }
};

/**
 * Update the TTL of the given value
 */
export const updateCacheTtlInDb = async (key: string, ttl: number) => {
    try {
        logger.info({ key, ttl }, 'Updating a cached value TTL');
        const updateItemCommand = new UpdateItemCommand({
            TableName: Table.CachingDynamo.tableName,
            Key: { id: { S: key } },
            AttributeUpdates: {
                exp: {
                    Action: 'PUT',
                    Value: { N: (Date.now() / 1000 + ttl).toString() },
                },
            },
            ReturnValues: 'NONE',
        });
        await dynamoDbClient.send(updateItemCommand);
    } catch (error) {
        logger.error(
            error,
            'An error occured while updating the TTL of the given value'
        );
        throw error;
    }
};

export type GetOrSetFromCacheParams = {
    key: string | unknown;
    neverExpire?: boolean;
    ttl?: number;
};

/**
 * Get or set a value from our cache
 * @param params
 * @param valueAccessor
 */
export const getOrSetFromCache = async <T>(
    params: GetOrSetFromCacheParams,
    valueAccessor: () => Promise<T>
): Promise<T> => {
    // Build our key hash
    let keyHash: string;
    if (typeof params.key === 'string') {
        keyHash = params.key;
    } else {
        keyHash = createHash('sha256')
            .update(JSON.stringify(params.key), 'utf8')
            .digest('hex');
    }

    // Get the current value from dynamoDbCache
    const currentCacheEntry = await getFromCache(keyHash);
    if (currentCacheEntry) {
        // Check if we need to prolongate the ttl
        if (
            params.neverExpire &&
            currentCacheEntry.ttl < Date.now() / 1000 + prolongationThreshold
        ) {
            await updateCacheTtlInDb(keyHash, neverExpireProlongationTtl);
        }
        // Return the current value
        return currentCacheEntry.value as T;
    }

    // Otherwise, fetch the new value and set it in the cache
    const newValue = await valueAccessor();
    const ttl = params.neverExpire ? neverExpireProlongationTtl : params.ttl;
    await setInCache(keyHash, newValue, ttl);

    // Return the new value
    return newValue;
};

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: Unreachable code error
BigInt.prototype.toJSON = function (): string {
    return this.toString();
};
