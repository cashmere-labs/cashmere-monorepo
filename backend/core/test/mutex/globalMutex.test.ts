import { DeleteItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { dynamoDbClient } from '../../src';

describe('[Backend][Core] Global mutex', () => {
    // The mock for the dynamo client
    const dynamoClientMock = mockClient(dynamoDbClient);

    // A test function that we will use to ensure it has been called
    const testFunction = vi.fn().mockResolvedValue('test');

    // The function we will test
    let runInMutex: <T>(key: unknown, fn: () => Promise<T>) => Promise<T>;

    beforeAll(async () => {
        // Mock the dynamo client returns
        vi.doMock('../../src/utils', () => ({
            dynamoDbClient: dynamoClientMock,
        }));

        // Get the function to test
        runInMutex = (await import('../../src/mutex/globalMutex')).runInMutex;
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

    it('[OK] Should run the function in the mutex with object key', async () => {
        // Try to call the test function
        const result = await runInMutex({ test: 'test' }, testFunction);
        // Ensure it has resolved nicely
        expect(testFunction).toHaveBeenCalledOnce();
        expect(result).toBe('test');
        // Ensure we checked the dynamo mock and we put the item nicely
        expect(dynamoClientMock.calls().length).toBe(2);
    });

    it('[Ok] Should be ko if the base function fail', async () => {
        const error = new Error('test');
        const testFailingFunction = vi.fn().mockRejectedValueOnce(error);

        // Ensure it has resolved nicely
        await expect(
            runInMutex('test', testFailingFunction)
        ).to.rejects.toThrowError(error);

        // Ensure we checked the dynamo mock and we call it once to put the item
        expect(dynamoClientMock.calls().length).toBe(2);
    });

    it('[Fail] Should be ko if the insert fail', async () => {
        // Reject on the put item command
        dynamoClientMock.on(PutItemCommand).rejects(new Error('test'));

        // Ensure it has resolved nicely
        await expect(
            runInMutex('test', testFunction)
        ).to.rejects.toThrowError();

        // Ensure we checked the dynamo mock and we call it once to put the item
        expect(dynamoClientMock.calls().length).toBe(1);
    });

    it("[Fail] Should be ko if we didn't release the lock", async () => {
        // Reject on the put item command
        dynamoClientMock.on(DeleteItemCommand).rejects(new Error('test'));

        // Ensure it has resolved nicely
        await expect(
            runInMutex('test', testFunction)
        ).to.rejects.toThrowError();

        // Ensure we checked the dynamo mock and we call it once to put the item
        expect(dynamoClientMock.calls().length).toBe(2);
    });
});
