import {
    CrossChainSwapInitiatedLogType,
    l0ChainIdToConfigMapViem,
    NATIVE_PLACEHOLDER,
    networkConfigs,
    SwapMessageReceivedLogType,
    SwapPayload,
} from '@cashmere-monorepo/backend-blockchain';
import { TEST_CHAIN_ID } from '@cashmere-monorepo/backend-blockchain/test/_setup';
import { logger, sqsClient } from '@cashmere-monorepo/backend-core';
import { SwapDataDbDto } from '@cashmere-monorepo/backend-database';
import { mockClient } from 'aws-sdk-client-mock';
import { getAddress, Hex } from 'viem';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

type NestedKeyOf<ObjectType extends object> = {
    [Key in keyof ObjectType &
        (string | number)]: ObjectType[Key] extends object
        ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
        : `${Key}`;
}[keyof ObjectType & (string | number)];

// Mocked swap data db dto
const mockedSwapDataDbDto = (
    skipProcessing: boolean = false
): SwapDataDbDto => ({
    swapId: '0x000000000',
    chains: {
        srcChainId: 1,
        dstChainId: 2,
        srcL0ChainId: 3,
        dstL0ChainId: 4,
    },
    path: {
        lwsPoolId: 1,
        hgsPoolId: 2,
        hgsAmount: '0',
        dstToken: '0x000',
        minHgsAmount: '0',
    },
    user: {
        receiver: '0x',
        signature: '0x0',
    },
    status: {},
    progress: {},
    skipProcessing,
});

const mockedSwapMessagePayload = ('0x00010002' +
    '000000000000000000000000000000000000acab' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '000000000000000000000000000000000000acab' +
    '00') as Hex;

describe('[Worker][Unit] Bridge - Event handler', () => {
    // Do we mock the swap data
    let mockSwapData = true;
    let isValidDstContractAddress = true;
    let swapDataSkipProcessing = false;

    // The mock for the batched tx
    const sqsClientMock = mockClient(sqsClient);

    /**
     * The method we will test
     */
    let handleSwapInitiatedEvent: (
        log: CrossChainSwapInitiatedLogType
    ) => Promise<SwapDataDbDto | undefined>;
    let handleSwapPerformedEvent = (log: SwapMessageReceivedLogType) =>
        Promise<void>;
    let sendContinueTxForSwapData = (swapData: SwapDataDbDto) => Promise<void>;

    /**
     * Before all tests, mock all dependencies and extract our method's
     */
    beforeAll(async () => {
        // Mock batched tx module
        vi.doMock('@cashmere-monorepo/backend-core', () => ({
            sqsClient: sqsClientMock,
            logger: logger,
        }));

        // Mock the database module
        vi.doMock('@cashmere-monorepo/backend-database', () => ({
            getSwapDataRepository: () => ({
                // TODO: Mocked input for the initial swap data
                get: async (id: string): Promise<SwapDataDbDto | undefined> =>
                    mockSwapData
                        ? mockedSwapDataDbDto(swapDataSkipProcessing)
                        : undefined,
                save: async (
                    swapData: SwapDataDbDto
                ): Promise<SwapDataDbDto | undefined> => swapData,
                // TODO: Update the swap data with the given field's
                update: async (
                    swapData: SwapDataDbDto
                ): Promise<SwapDataDbDto | null> => swapData,
            }),
        }));

        // Mock the aggregator repository
        vi.doMock('@cashmere-monorepo/backend-blockchain', () => ({
            // Aggregator mock
            getAggregatorRepository: () => ({
                getStartSwapArgs: async () => ({
                    args: [
                        {
                            dstAggregatorAddress: '',
                            srcToken: '',
                            srcAmount: 0,
                            lwsPoolId: 1,
                            hgsPoolId: 2,
                        },
                    ],
                }),
                isContractAddress: () => isValidDstContractAddress,
                encodeContinueSwapCallData: () => ({
                    target: getAddress(
                        '0x000000000000000000000000000000000000acab'
                    ),
                    data: '0xdeadbeef',
                }),
            }),
            // Asset router mock
            getAssetRouterRepository: () => ({
                getPoolTokenAsset: async () =>
                    getAddress('0x000000000000000000000000000000000000acab'),
            }),
            // Asset mock
            getAssetRepository: () => ({
                tokenSymbol: () => 'ETH',
                tokenDecimal: () => 18,
            }),
            // Bridge mock
            getBridgeRepository: () => ({
                getReceivedSwap: async () => ({
                    id: '0x0000000',
                    amount: 1n,
                    fee: 2n,
                    payload: mockedSwapMessagePayload,
                }),
            }),
            // Swap payload
            SwapPayload: SwapPayload,
            // Chain id mapping mock
            l0ChainIdToConfigMapViem,
            // network configs mock
            networkConfigs,
            // Native placeholder
            NATIVE_PLACEHOLDER,
        }));

        // TODO: Do the mock's required

        // Extract our method's

        // Import the tested functions after mocking dependencies
        const { buildEventHandler } = await import(
            '../../src/bridge/eventHandler'
        );
        const eventHandler = await buildEventHandler(TEST_CHAIN_ID);
        handleSwapInitiatedEvent = eventHandler.handleSwapInitiatedEvent;
        handleSwapPerformedEvent = eventHandler.handleSwapPerformedEvent;
        sendContinueTxForSwapData = eventHandler.sendContinueTxForSwapData;
    });

    /**
     * After each test, restore all mocks
     */
    afterEach(() => {
        // Reset our mock value
        mockSwapData = true;
        isValidDstContractAddress = true;
        swapDataSkipProcessing = false;
        // Reset our sqs client mock
        sqsClientMock.reset();
        // Restore all mocks
        vi.restoreAllMocks();
    });

    /**
     * A swap initiated event is received test's
     */
    describe('handleSwapInitiatedEvent', () => {
        it("[Ok] - Shouldn't do anything with empty logs", async () => {
            // Make the call
            // @ts-ignore
            const result = await handleSwapInitiatedEvent({
                blockNumber: 1n,
                transactionHash: '0x0',
                transactionIndex: 0,
                logIndex: 0,
                args: {},
            });
            // Ensure it's undefined
            expect(result).to.be.undefined;
        });

        it("[Ok] - Shouldn't do anything with no tx hash", async () => {
            // Make the call
            // @ts-ignore
            const result = await handleSwapInitiatedEvent({
                blockNumber: 1n,
                transactionIndex: 0,
                logIndex: 0,
                args: {
                    payload: mockedSwapMessagePayload,
                    dstChainId: TEST_CHAIN_ID,
                    id: '0xacab',
                    amount: 13n,
                    fee: 13n,
                },
            });
            // Ensure it's undefined
            expect(result).to.be.undefined;
        });

        it('[Ok] - Should be good with new swap data', async () => {
            // Make the call
            // @ts-ignore
            const result = await handleSwapInitiatedEvent({
                blockNumber: 1n,
                transactionHash: '0x0',
                transactionIndex: 0,
                logIndex: 0,
                args: {
                    payload: ('0x00010002' +
                        '000000000000000000000000000000000000acab' +
                        '0000000000000000000000000000000000000000000000000000000000000000' +
                        '000000000000000000000000000000000000acab' +
                        '00') as Hex,
                    dstChainId: TEST_CHAIN_ID,
                    id: '0xacab',
                    amount: 13n,
                    fee: 13n,
                },
            });
            // Ensure it's undefined
            expect(result).toBeDefined();
            expect(result?.swapId).toBe('0xacab');
            expect(result?.skipProcessing).toBe(false);
        });

        it('[Ok] - Should skip processing if not the right address', async () => {
            isValidDstContractAddress = false;
            // Make the call
            // @ts-ignore
            const result = await handleSwapInitiatedEvent({
                blockNumber: 1n,
                transactionHash: '0x0',
                transactionIndex: 0,
                logIndex: 0,
                args: {
                    payload: ('0x00010002' +
                        '000000000000000000000000000000000000acab' +
                        '0000000000000000000000000000000000000000000000000000000000000000' +
                        '000000000000000000000000000000000000acab' +
                        '00') as Hex,
                    dstChainId: TEST_CHAIN_ID,
                    id: '0xacab',
                    amount: 13n,
                    fee: 13n,
                },
            });
            // Ensure it's undefined
            expect(result).toBeDefined();
            expect(result?.swapId).toBe('0xacab');
            expect(result?.skipProcessing).toBe(true);
        });
    });

    /**
     * Send the swap continuation tx test
     */
    describe('sendContinueTxForSwapData', () => {
        it('[Ok] - Should send a continue swap tx', async () => {
            await sendContinueTxForSwapData(mockedSwapDataDbDto());
            expect(sqsClientMock.call(0)).toBeDefined();
            expect(sqsClientMock.call(1)).toBeNull();
        });
    });

    describe('handleSwapPerformedEvent', () => {
        it("[Ok] - Shouldn't do anything with no tx hash", async () => {
            // Make the call
            // @ts-ignore
            await handleSwapPerformedEvent({
                blockNumber: 1n,
                transactionIndex: 0,
                logIndex: 0,
                args: {},
            });
            // Assert that no message was pushed to the queue
            expect(sqsClientMock.call(0)).toBeNull();
        });

        it('[Fail] - Should fail with invalid message', async () => {
            // Make the call
            // @ts-ignore
            await expect(
                handleSwapPerformedEvent({
                    blockNumber: 1n,
                    transactionHash: '0x0',
                    transactionIndex: 0,
                    logIndex: 0,
                    args: {
                        // @ts-ignore
                        _message: {},
                    },
                })
            ).to.rejects.toThrow();
            // Make the call
            // @ts-ignore
            await expect(
                handleSwapPerformedEvent({
                    blockNumber: 1n,
                    transactionHash: '0x0',
                    transactionIndex: 0,
                    logIndex: 0,
                    args: {
                        // @ts-ignore
                        _message: {
                            id: '0xdeadbeef',
                        },
                    },
                })
            ).to.rejects.toThrow();
            // Assert that no message was pushed to the queue
            expect(sqsClientMock.call(0)).toBeNull();
        });

        it('[Ok] - Should be good with existing swap', async () => {
            // Make the call
            // @ts-ignore
            await handleSwapPerformedEvent({
                blockNumber: 1n,
                transactionIndex: 0,
                transactionHash: '0x0',
                logIndex: 0,
                args: {
                    _message: {
                        id: '0xdeadbeef',
                        srcChainId: TEST_CHAIN_ID,
                        srcPoolId: 1,
                        dstPoolId: 2,
                        amount: 1n,
                        fee: 2n,
                        vouchers: 3n,
                        optimalDstBandwidth: 3n,
                        receiver: '0xdeadbeef',
                        payload: '0xdeadbeef',
                    },
                },
            });
            // Assert that no message was pushed to the queue
            expect(sqsClientMock.call(0)).toBeDefined();
            expect(sqsClientMock.call(1)).toBeNull();
        });

        it('[Ok] - Should not send anything if skip processing was skipped', async () => {
            swapDataSkipProcessing = true;
            // Make the call
            // @ts-ignore
            await handleSwapPerformedEvent({
                blockNumber: 1n,
                transactionIndex: 0,
                transactionHash: '0x0',
                logIndex: 0,
                args: {
                    _message: {
                        id: '0xdeadbeef',
                        srcChainId: TEST_CHAIN_ID,
                        srcPoolId: 1,
                        dstPoolId: 2,
                        amount: 1n,
                        fee: 2n,
                        vouchers: 3n,
                        optimalDstBandwidth: 3n,
                        receiver: '0xdeadbeef',
                        payload: '0xdeadbeef',
                    },
                },
            });
            // Assert that no message was pushed to the queue
            expect(sqsClientMock.call(0)).toBeNull();
        });

        it('[Ok] - Should be good with non saved swap', async () => {
            mockSwapData = false;
            // Make the call
            // @ts-ignore
            await handleSwapPerformedEvent({
                blockNumber: 1n,
                transactionIndex: 0,
                transactionHash: '0x0',
                logIndex: 0,
                args: {
                    _message: {
                        id: '0xdeadbeef',
                        srcChainId: TEST_CHAIN_ID,
                        srcPoolId: 1,
                        dstPoolId: 2,
                        amount: 1n,
                        fee: 2n,
                        vouchers: 3n,
                        optimalDstBandwidth: 3n,
                        receiver: '0xdeadbeef',
                        payload: '0xdeadbeef',
                    },
                },
            });
            // Assert that no message was pushed to the queue
            expect(sqsClientMock.call(0)).toBeDefined();
            expect(sqsClientMock.call(1)).toBeNull();
        });
    });
});
