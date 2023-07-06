import { GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { GetOrSetFromCacheParams, dynamoDbClient } from '../../src';

describe('[Backend][Core] DynamoDB cache', () => {
    // The mock for the dynamo client
    const dynamoClientMock = mockClient(dynamoDbClient);

    // A test function that we will use to ensure it has been called
    const testFunction = vi.fn().mockResolvedValue('test');

    // The function we will test
    let getOrSetFromCache: <T>(
        params: GetOrSetFromCacheParams,
        valueAccessor: () => Promise<T>
    ) => Promise<T>;
    let getFromCache: <T>(
        key: string
    ) => Promise<{ value: T; ttl: number } | undefined>;
    let setInCache: (key: string, value: unknown, ttl: number) => Promise<void>;
    let updateCacheTtlInDb: (key: string, ttl: number) => Promise<void>;

    beforeAll(async () => {
        // Mock the dynamo client returns
        vi.doMock('../../src/utils', () => ({
            dynamoDbClient: dynamoClientMock,
        }));

        // Get the function to test
        const importedFunctions = await import('../../src/cache/dynamoDbCache');
        setInCache = importedFunctions.setInCache;
        updateCacheTtlInDb = importedFunctions.updateCacheTtlInDb;
        getFromCache = importedFunctions.getFromCache;
        getOrSetFromCache = importedFunctions.getOrSetFromCache;
    });

    /**
     * After each test, restore all mocks
     */
    afterEach(() => {
        // Reset our dynamo client mock
        dynamoClientMock.reset();
        // Restore all mocks
        vi.restoreAllMocks();
    });

    describe('getFromCache', () => {
        it('[Fail] Should throw back an error if any ', () => {
            const error = new Error('test');
            dynamoClientMock.on(GetItemCommand).rejectsOnce(error);
            // Call get from cache
            return expect(getFromCache('test')).rejects.toThrow(error);
        });

        it('[Ok] Should succeed if a value is in cache', async () => {
            dynamoClientMock.on(GetItemCommand).resolves({
                Item: {
                    value: { S: JSON.stringify('test') },
                    ttl: { N: '1000' },
                },
            });
            // Call get from cache
            const result = await getFromCache('test');
            // Check the result
            expect(result).toEqual({ value: 'test', ttl: 1000 });
        });

        it('[Ok] Should be ok with no ttl data', async () => {
            dynamoClientMock.on(GetItemCommand).resolves({
                Item: {
                    value: { S: JSON.stringify('test') },
                },
            });
            // Call get from cache
            const result = await getFromCache('test');
            // Check the result
            expect(result).toEqual({ value: 'test', ttl: 0 });
        });

        it('[Ok] Should succeed if a value is in cache but whithout string value', async () => {
            dynamoClientMock.on(GetItemCommand).resolves({
                Item: {
                    value: { N: '1000' },
                    ttl: { N: '1000' },
                },
            });
            // Call get from cache
            const result = await getFromCache('test');
            // Check the result
            expect(result).toBeUndefined();
        });
    });

    describe('setInCache', () => {
        it('[Fail] Should throw back an error if any ', () => {
            const error = new Error('test');
            dynamoClientMock.on(UpdateItemCommand).rejectsOnce(error);
            // Call set in cache
            return expect(setInCache('test', 'test', 10)).rejects.toThrow(
                error
            );
        });

        it('[Ok] Should insert a value', async () => {
            // Call set in cache
            await setInCache('test', 'test', 10);
            // Check the result
            expect(dynamoClientMock.calls().length).toEqual(1);
        });
    });

    describe('updateCacheTtlInDb', () => {
        it('[Fail] Should throw back an error if any', () => {
            const error = new Error('test');
            dynamoClientMock.on(UpdateItemCommand).rejectsOnce(error);
            // Call set in cache
            return expect(updateCacheTtlInDb('test', 10)).rejects.toThrow(
                error
            );
        });

        it('[Ok] Should update ttl value', async () => {
            // Call set in cache
            await updateCacheTtlInDb('test', 10);
            // Check the result
            expect(dynamoClientMock.calls().length).toEqual(1);
        });
    });

    describe('getOrSetFromCache', () => {
        const testValueAccessor = vi.fn().mockResolvedValue({ test: 'test' });

        it('[Fail] Should throw back an error if any during fetch', () => {
            const error = new Error('test');
            dynamoClientMock.on(GetItemCommand).rejectsOnce(error);
            // Call set in cache
            return expect(
                getOrSetFromCache({ key: 'test' }, testValueAccessor)
            ).rejects.toThrow(error);
        });

        it('[Fail] Should throw back an error if any during save', () => {
            const error = new Error('test');
            dynamoClientMock.on(UpdateItemCommand).rejectsOnce(error);
            // Call set in cache
            return expect(
                getOrSetFromCache({ key: 'test' }, testValueAccessor)
            ).rejects.toThrow(error);
        });

        it('[Ok] Should be ok with string keys', async () => {
            // Call get or set from cache
            await getOrSetFromCache({ key: 'test' }, testValueAccessor);
            // Check the result
            expect(testValueAccessor).toHaveBeenCalledOnce();
            expect(dynamoClientMock.calls().length).toEqual(2);
        });

        it('[Ok] Should be ok with object keys', async () => {
            // Call get or set from cache
            await getOrSetFromCache(
                { key: { test: 'test' } },
                testValueAccessor
            );
            // Check the result
            expect(testValueAccessor).toHaveBeenCalledOnce();
            expect(dynamoClientMock.calls().length).toEqual(2);
        });

        it('[Ok] Should be ok with never expiring objects', async () => {
            // Call get or set from cache
            await getOrSetFromCache(
                { key: { test: 'test' }, neverExpire: true },
                testValueAccessor
            );
            // Check the result
            expect(testValueAccessor).toHaveBeenCalledOnce();
            expect(dynamoClientMock.calls().length).toEqual(2);
        });

        it('[Ok] Should prolongate TTL if present and should never expire', async () => {
            dynamoClientMock.on(GetItemCommand).resolves({
                Item: {
                    value: { S: JSON.stringify('test') },
                    ttl: { N: '1000' },
                },
            });
            // Call get or set from cache
            await getOrSetFromCache(
                { key: 'test', neverExpire: true },
                testValueAccessor
            );
            // Check the result
            expect(testValueAccessor).not.toHaveBeenCalled();
            expect(dynamoClientMock.calls().length).toEqual(2);
        });

        it('[Ok] Should not prolongate TTL if present and recent insert', async () => {
            dynamoClientMock.on(GetItemCommand).resolves({
                Item: {
                    value: { S: JSON.stringify('test') },
                    ttl: { N: (Date.now() / 1000 + 100000).toFixed(0) },
                },
            });
            // Call get or set from cache
            await getOrSetFromCache(
                { key: 'test', neverExpire: true },
                testValueAccessor
            );
            // Check the result
            expect(testValueAccessor).not.toHaveBeenCalled();
            expect(dynamoClientMock.calls().length).toEqual(1);
        });
    });
});
