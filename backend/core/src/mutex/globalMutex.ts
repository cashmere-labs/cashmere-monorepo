import {
    DeleteItemCommand,
    DeleteItemInput,
    PutItemCommand,
    PutItemInput,
} from '@aws-sdk/client-dynamodb';
import { createHash } from 'node:crypto';
import { try as inlineTry } from 'radash';
import { Table } from 'sst/node/table';
import { logger } from '../logger/logger';
import { dynamoDbClient } from '../utils';

// Default expiration from our dynamoDbLock, 1min
const cleanupAfterSeconds = 60;

/**
 * Run the function inside a global mutex
 * @param key Key to run the function in mutex
 * @param fn The function to be run
 */
export const runInMutex = async <T>(
    key: unknown,
    fn: () => Promise<T>
): Promise<T> => {
    // Build our key hash
    let executionHash: string;
    if (typeof key === 'string') {
        executionHash = key;
    } else {
        executionHash = createHash('sha256')
            .update(JSON.stringify(key), 'utf8')
            .digest('hex');
    }

    // Check if we got a lock in the dynamo
    const isLocked = await checkLockAndInsert(executionHash);
    if (isLocked)
        throw new Error(
            `The key ${executionHash} is locked, unable to execute the function in the mutex context`
        );

    // Execute the function
    const [err, result] = await inlineTry(fn)();

    // Release the lock
    await releaseLock(executionHash);

    // Return the result if any
    if (result) return result;

    // Otherwise, throw the error
    throw err;
};

/**
 * Check if the given key is locked
 * @param key
 */
const checkLockAndInsert = async (key: string): Promise<boolean> => {
    // Build the params
    const params: PutItemInput = {
        TableName: Table.MutexDynamo.tableName,
        Item: {
            executionKey: {
                S: key,
            },
            ttl: {
                N: (Date.now() / 1000 + cleanupAfterSeconds).toFixed(2),
            },
        },
        ConditionExpression: 'attribute_not_exists(#executionKey)',
        ExpressionAttributeNames: {
            '#executionKey': key,
        },
    };

    // Try to put the item
    try {
        logger.debug(`Checking lock status for key ${key}`);
        await dynamoDbClient.send(new PutItemCommand(params));
        return false;
    } catch (e: any) {
        if (e.code === 'ConditionalCheckFailedException') {
            return true;
        }
        logger.error(e, 'error when puting the locking in base');
        throw e;
    }
};

/**
 * Release the lock
 * @param key
 */
const releaseLock = async (key: string) => {
    const params: DeleteItemInput = {
        TableName: Table.MutexDynamo.tableName,
        Key: {
            executionKey: {
                S: key,
            },
        },
    };
    try {
        logger.debug(`Releasing the lock for key ${key}`);
        await dynamoDbClient.send(new DeleteItemCommand(params));
        return true;
    } catch (e: any) {
        logger.error(e, 'error when deleting the lock in base');
        throw e;
    }
};
