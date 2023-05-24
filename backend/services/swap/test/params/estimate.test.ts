import { describe, expect, it } from 'vitest';
import { swapEstimation } from '../../src';

/**
 * Mocked input data for the estimate swap test
 */
const mockedSwapInput = {
    srcChainId: 59140,
    srcToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    amount: 100000000000000000000n,
    dstChainId: 80001,
    dstToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
};

/**
 * Swap estimate business logic test
 */
describe('[Swap][Logic] Estimate', () => {
    it(`[Fail] Invalid network's`, async () => {
        // Invalid src chain id
        await expect(async () =>
            swapEstimation({
                ...mockedSwapInput,
                srcChainId: 0,
            })
        ).rejects.toThrowError();
        // Invalid dst chain id
        await expect(async () =>
            swapEstimation({
                ...mockedSwapInput,
                dstChainId: 0,
            })
        ).rejects.toThrowError();
    });

    it('[Ok] Should succeed with mocked input', async () => {
        // Pass a valid mocked input and test the result
        const result = await swapEstimation(mockedSwapInput);
        // Ensure we got all the right properties
        expect(result).toBeDefined();
        expect(result).toHaveProperty('dstAmount');
        expect(result).toHaveProperty('fee');
        expect(result).toHaveProperty('minReceivedDst');
        expect(result).toHaveProperty('nativeFee');
        expect(result).toHaveProperty('priceImpact');
    });
});
