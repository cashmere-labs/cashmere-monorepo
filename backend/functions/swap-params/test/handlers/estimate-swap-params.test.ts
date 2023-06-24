import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { handler } from '../../src/handlers/estimate-swap-params';

/**
 * Swap estimate business logic test
 */
describe('[Swap][Endpoint] Estimate', () => {
    const estimateSwapMock = vi.fn(() => ({
        dstAmount: '1',
        minReceivedDst: '2',
        fee: '3',
        priceImpact: '4',
        nativeFee: '5',
    }));

    let handlerToTest: typeof handler;

    beforeAll(async () => {
        vi.doMock('@cashmere-monorepo/backend-service-swap', () => ({
            swapEstimation: estimateSwapMock,
        }));

        handlerToTest = (
            await import('../../src/handlers/estimate-swap-params')
        ).handler;
    });

    afterEach(() => {
        // Reset the mocks
        vi.clearAllMocks();
    });

    // Ensure it fail if we don't provide any input param
    it('[Fail] No input param', async () => {
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
                    srcChainId: '10050',
                    srcToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
                    dstChainId: '10051',
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
                    srcChainId: '10050',
                    srcToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
                    amount: '100000000000000000000',
                    dstChainId: '10051',
                    dstToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
                    extra: 'extra',
                },
            },
            {}
        );
        expect(estimateSwapMock).toHaveBeenCalledOnce();
        expect(result.statusCode).toBe(200);
    });

    // Ensure it executes successfully with correct params
    it("[Ok] Pass with good param's", async () => {
        const result = await handlerToTest(
            // @ts-ignore
            {
                queryStringParameters: {
                    srcChainId: '10050',
                    srcToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
                    amount: '100000000000000000000',
                    dstChainId: '10050',
                    dstToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
                },
            },
            {}
        );
        expect(estimateSwapMock).toHaveBeenCalledOnce();
        expect(result.statusCode).toBe(200);
    });
});
