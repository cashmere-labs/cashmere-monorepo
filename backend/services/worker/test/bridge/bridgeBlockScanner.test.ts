import { TEST_CHAIN_ID } from '@cashmere-monorepo/backend-blockchain/test/_setup';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

describe('[Worker][Unit] Bridge - Bridge block scanner', () => {
    /**
     * The method we will test
     */
    let handleNewBlock: (blockRange: {
        from: bigint;
        to: bigint;
    }) => Promise<{ lastBlockHandled: bigint }>;

    /**
     * Before all tests, mock all dependencies and extract our method's
     */
    beforeAll(async () => {
        // Mock the blockchain repository repository
        vi.doMock('@cashmere-monorepo/backend-blockchain', () => ({
            getBlockchainRepository: () => ({
                getMaxedOutScanToBlock: (range: { to: bigint }) => ({
                    maxBlock: range.to,
                }),
            }),
            getAssetRouterRepository: () => ({
                getSwapInitiatedEvents: async () => [{}, {}],
            }),
            getBridgeRepository: () => ({
                getSwapMessageReceivedEvents: async () => [{}, {}],
            }),
        }));

        vi.doMock('../../src/bridge/eventHandler', () => ({
            buildEventHandler: () => ({
                handleSwapInitiatedEvent: vi
                    .fn()
                    .mockRejectedValueOnce(new Error('test error')),
                handleSwapPerformedEvent: vi
                    .fn()
                    .mockRejectedValueOnce(new Error('test error')),
            }),
        }));

        // Import the tested functions after mocking dependencies
        const { buildBridgeBlockScanner } = await import(
            '../../src/bridge/bridgeBlockScanner'
        );
        const blockScanner = await buildBridgeBlockScanner(TEST_CHAIN_ID);
        handleNewBlock = blockScanner.handleNewBlock;
    });

    /**
     * After each test, restore all mocks
     */
    afterEach(() => {
        // Restore all mocks
        vi.restoreAllMocks();
    });

    /**
     * Handle new block tests
     */
    it('[OK] handleNewBlock', async () => {
        const result = await handleNewBlock({ from: 0n, to: 420n });
        expect(result).toEqual({ lastBlockHandled: 420n });
    });
});
