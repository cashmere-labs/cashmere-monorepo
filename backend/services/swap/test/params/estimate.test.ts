import {
    ONE_INCH_SLIPPAGE,
    getL0ChainFromChainId,
    getNetworkConfig,
    isPlaceholderToken,
} from '@cashmere-monorepo/backend-blockchain';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
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
    let swapEstimationTest: typeof swapEstimation;

    /**
     * Before all tests, mock all dependencies and extract our method's
     */
    beforeAll(async () => {
        // Mock the blockchain repository repository
        vi.doMock('@cashmere-monorepo/backend-blockchain', () => ({
            getAssetRepository: () => ({
                tokenSymbol: async () => 'ETH',
                tokenDecimal: async () => 18,
            }),
            getAssetRouterRepository: () => ({
                quoteSwaps: async () => ({
                    potentialOutcome: 1n,
                    haircut: 1n,
                    minPotentialOutcome: 1n,
                }),
                getPoolTokenAsset: async () =>
                    '0x86738E8b53e14449Cc4A7EFBb1F701bFA3c19b08',
            }),
            getBridgeRepository: () => ({
                getSwapFeeL0: async () => 1n,
            }),
            getUniswapRepository: () => ({
                getAmountOut: async () => ({
                    minDstAmount: 1n,
                    dstAmount: 2n,
                }),
            }),
            // Some flat pass from initial implementation
            isPlaceholderToken,
            getNetworkConfig,
            getL0ChainFromChainId,
            ONE_INCH_SLIPPAGE,
        }));

        // Import the tested functions after mocking dependencies
        const tmpImport = await import('../../src');
        swapEstimationTest = tmpImport.swapEstimation;
    });

    /**
     * After each test, restore all mocks
     */
    afterEach(() => {
        // Restore all mocks
        vi.restoreAllMocks();
    });

    it(`[Fail] Invalid network's`, async () => {
        // Invalid src chain id
        await expect(async () =>
            swapEstimationTest({
                ...mockedSwapInput,
                srcChainId: 0,
            })
        ).rejects.toThrowError();
        // Invalid dst chain id
        await expect(async () =>
            swapEstimationTest({
                ...mockedSwapInput,
                dstChainId: 0,
            })
        ).rejects.toThrowError();
    });

    it('[Ok] Should succeed with mocked input', async () => {
        // Pass a valid mocked input and test the result
        const result = await swapEstimationTest(mockedSwapInput);
        // Ensure we got all the right properties
        expect(result).toBeDefined();
        expect(result).toHaveProperty('dstAmount');
        expect(result).toHaveProperty('fee');
        expect(result).toHaveProperty('minReceivedDst');
        expect(result).toHaveProperty('nativeFee');
        expect(result).toHaveProperty('priceImpact');
    });
});
