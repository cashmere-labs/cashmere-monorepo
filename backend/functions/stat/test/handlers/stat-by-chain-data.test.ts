import { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { handler } from '../../src/handlers/statByChain';
describe('[Stat][Endpoint] statByChain', () => {
    const statByChain = vi.fn(() => ({
        status: 'ok',
        stats: {
            chainId: 1,
            transactionCount: 1000,
            volume: '$10000',
            fee: '$100',
            tvl: '$100000',
        },
    }));

    let handlerToTest: typeof handler;

    beforeAll(async () => {
        vi.doMock('@cashmere-monorepo/backend-database', () => ({
            getStatRepository: async () => ({
                getByChainId: statByChain,
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

    it('[Fail] chainId query param is not provided', async () => {
        const result = await handlerToTest(
            {} as APIGatewayProxyEventV2,
            {} as Context
        );
        expect(result.statusCode).toBe(400);
    });

    it('[Fail] chainId query should be a number', async () => {
        const result = await handlerToTest(
            {
                chainId: 'test',
            } as unknown as APIGatewayProxyEventV2,
            {} as Context
        );
        expect(result.statusCode).toBe(400);
    });

    // should be ok with good param's
    it("[Ok] Pass with good param's", async () => {
        const result = await handlerToTest(
            {
                queryStringParameters: {
                    chainId: '1',
                },
            } as unknown as APIGatewayProxyEventV2,
            {} as Context
        );
        console.log(result);
        expect(result.statusCode).toBe(200);
    });
});
