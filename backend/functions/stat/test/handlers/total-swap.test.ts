import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { handler } from '../../src/handlers/totalSwaps';

describe('[Stat][Endpoint] totalSwaps', () => {
    const totalSwaps = vi.fn(() => ({
        count: 1,
        items: [
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
                getAll: totalSwaps,
            }),
        }));
        // Import the tested function after mocking dependencies
        ({ handler: handlerToTest } = await import(
            '../../src/handlers/totalSwaps'
        ));
    });

    afterEach(() => {
        // Reset the mocks
        vi.clearAllMocks();
    });

    // should be ok with good param's
    it("[Ok] Pass with good param's", async () => {
        const result = await handlerToTest({}, {});
        expect(result.statusCode).toBe(200);
    });
});
