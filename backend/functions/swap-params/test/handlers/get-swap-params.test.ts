import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { handler } from '../../src/handlers/get-swap-params';

/**
 * Swap params business logic test
 */
describe('[Swap][Endpoint] Params', () => {
    const getSwapParamsMock = vi.fn(() => ({
        args: {
            srcToken: '1',
            srcAmount: '1',
            lwsPoolId: '1',
            hgsPoolId: '1',
            dstToken: '1',
            dstChain: '1',
            dstAggregatorAddress: '1',
            minHgsAmount: '1',
        },
        to: '2',
        value: '3',
        swapData: '4',
    }));

    let handlerToTest: typeof handler;

    beforeAll(async () => {
        vi.doMock('@cashmere-monorepo/backend-service-swap', () => ({
            getSwapParams: getSwapParamsMock,
        }));

        handlerToTest = (await import('../../src/handlers/get-swap-params'))
            .handler;
    });

    afterEach(() => {
        // Reset the mocks
        vi.clearAllMocks();
    });

    // Ensure it fail if we don't provide any input param
    it('[Fail] No input params', async () => {
        // @ts-ignore
        const result = await handlerToTest({}, {});
        expect(result.statusCode).toBe(400);
    });

    // Ensure it fail if we don't provide all required params
    it('[Fail] Not all param are present', async () => {
        const result = await handlerToTest(
            // @ts-ignore
            {
                queryStringParameters: {
                    srcChainId: '59140',
                    srcToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
                    dstChainId: '80001',
                    dstToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
                },
            },
            {}
        );
        expect(result.statusCode).toBe(400);
    });

    // Ensure it doesn't fail if we provide extra params
    it("[Ok] Don't fail with extra param", async () => {
        const result = await handlerToTest(
            // @ts-ignore
            {
                queryStringParameters: {
                    srcChainId: '59140',
                    srcToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
                    amount: '100000000000000000000',
                    dstChainId: '80001',
                    dstToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
                    receiver: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
                    extra: 'extra',
                },
            },
            {}
        );
        expect(result.statusCode).toBe(200);
        expect(getSwapParamsMock).toHaveBeenCalledOnce();
    });

    // Ensure it executes successfully with correct params
    it('[Ok] Pass with good params', async () => {
        const result = await handlerToTest(
            // @ts-ignore
            {
                queryStringParameters: {
                    srcChainId: '59140',
                    srcToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
                    amount: '100000000000000000000',
                    dstChainId: '80001',
                    receiver: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
                    dstToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
                },
            },
            {}
        );
        expect(result.statusCode).toBe(200);
        expect(getSwapParamsMock).toHaveBeenCalledOnce();
    });
});
