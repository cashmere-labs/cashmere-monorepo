import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { handler } from '../../src/handlers/listSwaps';

describe('[Stat][Endpoint] listSwaps', () => {
    const listSwaps = vi.fn(() => ({
        total: 1,
        swaps: [
            {
                id: 1,
                srcChainId: 1,
                dstChainId: 2,
                srcToken: 'srcToken',
                dstToken: 'dstToken',
                srcAmount: '1',
                dstAmount: '2',
                minReceivedDst: '3',
                fee: '4',
                priceImpact: '5',
                nativeFee: '6',
                createdAt: '2021-01-01',
            },
        ],
    }));

    let handlerToTest: typeof handler;

    beforeAll(async () => {
        vi.doMock('@cashmere-monorepo/backend-database', () => ({
            getSwapDataRepository: async () => ({
                getAll: listSwaps,
            }),
        }));

        // Import the tested function after mocking dependencies
        ({ handler: handlerToTest } = await import(
            '../../src/handlers/listSwaps'
        ));
    });

    afterEach(() => {
        // Reset the mocks
        vi.clearAllMocks();
    });

    // Ensure it fail if we don't provide any input param
    it("[Fail] Don't exist with wrong method", async () => {
        const result = await handlerToTest({}, {});
        expect(result.statusCode).toBe(400);
    });

    it('[Fail] Page query param is not provided', async () => {
        const result = await handlerToTest(
            {
                queryStringParameters: {},
            },
            {}
        );
        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).details).toBe('Missing page number');
    });

    it('[Fail] Page query should be a number', async () => {
        const result = await handlerToTest(
            {
                queryStringParameters: {
                    page: 'test',
                },
            },
            {}
        );
        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).details).toBe('Page should be a number');
    });

    // // should be ok with good param's
    it("[Ok] Pass with good param's", async () => {
        const result = await handlerToTest(
            {
                queryStringParameters: {
                    page: '1',
                },
            },
            {}
        );
        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body).status).toBe('OK');
    });
});
