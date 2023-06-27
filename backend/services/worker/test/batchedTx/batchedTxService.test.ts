import { TEST_CHAIN_ID } from '@cashmere-monorepo/backend-blockchain/test/_setup';
import { logger } from '@cashmere-monorepo/backend-core';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { NewBatchedTx } from '../../src/batchedTx/types';

describe('[Worker][Unit] Batched TX - Batched tx service', () => {
    let txWithSameHashExist: boolean = false;
    let hasTxToSent: boolean = true;
    let hasSentTx: boolean = true;

    // The mock function we will test
    const hasTxWithSecurityHashMock = vi.fn(() => txWithSameHashExist);
    const createBatchedTxMock = vi.fn();
    const updateTxsStatusMock = vi.fn();
    const sendBatchedTxMock = vi.fn(async () => ({
        txHash: '0x123',
        successIdx: hasSentTx ? [0] : [],
        failedIdx: hasSentTx ? [1] : [],
    }));

    // The method we will test
    let handleNewTx: (tx: NewBatchedTx) => Promise<void>;
    let sendBatchedTx: (chainIn: number) => Promise<void>;

    /**
     * Before all tests, mock all dependencies and extract our method's
     */
    beforeAll(async () => {
        // Mock backend core module
        vi.doMock('@cashmere-monorepo/backend-core', () => ({
            logger: logger,
            runInMutex: async (key: string, fn: () => Promise<void>) => fn(),
        }));

        // Mock the blockchain repository repository
        vi.doMock('@cashmere-monorepo/backend-blockchain', () => ({
            getMultiCallRepository: () => ({
                sendBatchedTx: sendBatchedTxMock,
            }),
            getBlockchainRepository: () => ({
                getGasFeesParam: async () => ({
                    gasLimit: 1n,
                }),
            }),
        }));

        // Mock the database repository
        vi.doMock('@cashmere-monorepo/backend-database', () => ({
            getBatchedTxRepository: async () => ({
                create: createBatchedTxMock,
                hasTxWithSecurityHash: hasTxWithSecurityHashMock,
                updateTxsStatus: updateTxsStatusMock,
                getPendingTxForChain: () =>
                    hasTxToSent
                        ? [
                              // Success TX
                              {
                                  chainId: TEST_CHAIN_ID,
                                  priority: 1,
                                  target: '0x123',
                                  data: '0x123',
                                  securityHash: '0x123',
                                  status: 'pending',
                              },
                              // Failing TX
                              {
                                  chainId: TEST_CHAIN_ID,
                                  priority: 2,
                                  target: '0x123',
                                  data: '0x123',
                                  securityHash: '0x123',
                                  status: 'pending',
                              },
                          ]
                        : [],
            }),
        }));

        // Import the tested functions after mocking dependencies
        const { buildBatchedTxService } = await import(
            '../../src/batchedTx/batchedTxService'
        );
        const batchedTxService = await buildBatchedTxService();
        handleNewTx = batchedTxService.handleNewTx;
        sendBatchedTx = batchedTxService.sendBatchedTx;
    });

    /**
     * After each test, restore all mocks
     */
    afterEach(() => {
        txWithSameHashExist = false;
        hasTxToSent = true;
        hasSentTx = true;
        // Restore all mocks
        vi.restoreAllMocks();
    });

    describe('handleNewTx', () => {
        it('[OK] Should be able to create a new tx', async () => {
            const txData: NewBatchedTx = {
                chainId: TEST_CHAIN_ID,
                priority: 1,
                target: '0x123',
                data: '0x123',
                securityHash: '0x123',
            };
            await handleNewTx(txData);
            // Ensure the create method has been called
            expect(hasTxWithSecurityHashMock).toHaveBeenCalledWith(
                txData.securityHash
            );
            expect(createBatchedTxMock).toHaveBeenCalledWith(txData);
        });
        it('[OK] Shouldnt save new tx if one with same security hash exist', async () => {
            txWithSameHashExist = true;
            const txData: NewBatchedTx = {
                chainId: TEST_CHAIN_ID,
                priority: 1,
                target: '0x123',
                data: '0x123',
                securityHash: '0x123',
            };
            await handleNewTx(txData);
            // Ensure the create method has been called
            expect(hasTxWithSecurityHashMock).toHaveBeenCalledWith(
                txData.securityHash
            );
            expect(createBatchedTxMock).not.toHaveBeenCalled();
        });
    });

    describe('sendBatchedTx', () => {
        it('[OK] Shouldnt do anything if not tx need to be sent', async () => {
            hasTxToSent = false;
            await sendBatchedTx(TEST_CHAIN_ID);
            expect(updateTxsStatusMock).not.toHaveBeenCalled();
        });
        it('[OK] Should send all the batched tx', async () => {
            await sendBatchedTx(TEST_CHAIN_ID);
            expect(sendBatchedTxMock).toHaveBeenCalledOnce();
            expect(updateTxsStatusMock).toHaveBeenCalled();
        });
        it('[OK] Should not udpate anything if no tx has been sent', async () => {
            hasSentTx = false;
            await sendBatchedTx(TEST_CHAIN_ID);
            expect(sendBatchedTxMock).toHaveBeenCalledOnce();
            expect(updateTxsStatusMock).not.toHaveBeenCalled();
        });
    });
});
