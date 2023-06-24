import { TEST_CHAIN_ID } from '@cashmere-monorepo/backend-blockchain/test/_setup';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { mockedSwapDataDbDto } from '../utils/mock';

// Get the swap data waiting for completion
async function* swapDataCursorGenerator() {
    let i = 0;
    while (i < 3) {
        const continueTxId = i === 2 ? '0xdeadbeef' : undefined;
        i++;
        yield mockedSwapDataDbDto({ swapContinueTxid: continueTxId });
    }
}

describe('[Worker][Unit] Bridge - Bridge service', () => {
    let checkAllTxTxExist = false;
    let checkAllTxStatus = 'success';

    // The method we will test
    let scanEveryBlockchain: () => Promise<void>;

    // Some value for our mocking's
    let returnLastBlock = true;

    // Some mocked function's
    const updateLastBlockMock = vi.fn();
    const updateSwapDataMock = vi.fn();
    const handleNewBlockMock = vi.fn(async (range: { to: bigint }) => ({
        lastBlockHandled: range.to,
    }));
    const sendContinueSwapDataMock = vi.fn();

    /**
     * Before all tests, mock all dependencies and extract our method's
     */
    beforeAll(async () => {
        // Mock the blockchain repository repository
        vi.doMock('@cashmere-monorepo/backend-blockchain', () => ({
            getBlockchainRepository: () => ({
                getLastBlockNumber: async () => 100n,
                getTransactionReceipt: async () =>
                    checkAllTxTxExist
                        ? {
                              blockNumber: 13n,
                              status: checkAllTxStatus,
                          }
                        : undefined,
            }),
            CHAIN_IDS: [TEST_CHAIN_ID],
        }));

        // Mock the database repository
        vi.doMock('@cashmere-monorepo/backend-database', () => ({
            getLastBlockRepository: () => ({
                getForChainAndType: () => (returnLastBlock ? 1 : 0),
                updateForChainAndType: updateLastBlockMock,
            }),
            getSwapDataRepository: () => ({
                // TODO: Cursor mocking?
                getWaitingForCompletionsOnDstChainCursor: async () =>
                    swapDataCursorGenerator(),
                update: updateSwapDataMock,
            }),
        }));

        vi.doMock('../../src/bridge/eventHandler', () => ({
            buildEventHandler: () => ({
                sendContinueTxForSwapData: sendContinueSwapDataMock,
            }),
        }));
        vi.doMock('../../src/bridge/bridgeBlockScanner', () => ({
            buildBridgeBlockScanner: () => ({
                handleNewBlock: handleNewBlockMock,
            }),
        }));

        // Import the tested functions after mocking dependencies
        scanEveryBlockchain = (await import('../../src/bridge/bridgeService'))
            .scanEveryBlockchain;
    });

    /**
     * After each test, restore all mocks
     */
    afterEach(() => {
        returnLastBlock = true;
        checkAllTxTxExist = false;
        checkAllTxStatus = 'success';
        // Restore all mocks
        vi.restoreAllMocks();
    });

    /**
     * Handle new block tests
     */
    it('[OK] Should update target block and exit early in case of no last block', async () => {
        returnLastBlock = false;
        await scanEveryBlockchain();
        // Ensure the update last block has been called
        expect(updateLastBlockMock).toHaveBeenCalledWith(
            TEST_CHAIN_ID,
            'bridge',
            100
        );
        // Ensure the handle new block hasn't been called
        expect(handleNewBlockMock).not.toHaveBeenCalled();
    });

    /**
     * Handle new block tests
     */
    it('[OK] Should be ok when everything is good', async () => {
        await scanEveryBlockchain();
        // Ensure the handle new block has been called
        expect(handleNewBlockMock).toHaveBeenCalledOnce();
    });

    /**
     * Handle new block tests
     */
    it('[OK] Check All - shouldnt do anything if tx found with wrong status', async () => {
        checkAllTxTxExist = true;

        await scanEveryBlockchain();
        // Ensure the handle new block has been called
        expect(handleNewBlockMock).toHaveBeenCalledOnce();
    });

    /**
     * Handle new block tests
     */
    it('[OK] Check All - should resend if tx found with wrong status', async () => {
        checkAllTxTxExist = true;
        checkAllTxStatus = 'reverted';

        await scanEveryBlockchain();
        // Ensure the handle new block has been called
        expect(handleNewBlockMock).toHaveBeenCalledOnce();
        // Ensure the resent tx method has been called
        expect(sendContinueSwapDataMock).toHaveBeenCalledOnce();
    });
});
