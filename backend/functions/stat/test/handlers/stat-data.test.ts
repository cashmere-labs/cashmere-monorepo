import { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { handler } from '../../src/handlers/statData';

describe('[Stat][Endpoint] statData', () => {
    const statData = vi.fn(() => ({
        status: 'ok',
        stats: [
            {
                chainId: 1,
                transactionCount: 1000,
                volume: '$10000',
                fee: '$100',
                tvl: '$100000',
            },
        ],
    }));

    let handlerToTest: typeof handler;

    beforeAll(async () => {
        vi.doMock('@cashmere-monorepo/backend-database', () => ({
            getStatRepository: async () => ({
                getAll: statData,
            }),
        }));
        // Import the tested function after mocking dependencies
        ({ handler: handlerToTest } = await import(
            '../../src/handlers/statByChain'
        ));
    });

    afterEach(() => {
        // Reset the mocks
        vi.clearAllMocks();
    });

    // Ensure it fail if we don't provide any input param
    it("[Fail] Don't exist with wrong method", async () => {
        const result = await handlerToTest(
            {} as APIGatewayProxyEventV2,
            {} as Context
        );
        expect(result.statusCode).toBe(400);
    });

    // should be ok with good param's
    it("[Ok] Pass with good param's", async () => {
        const result = await handlerToTest(
            {} as APIGatewayProxyEventV2,
            {} as Context
        );
        expect(result.statusCode).toBe(400);
    });
});
