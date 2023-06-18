import {
    CrossChainSwapInitiatedLogType,
    SwapMessageReceivedLogType,
} from '@cashmere-monorepo/backend-blockchain';
import { TEST_CHAIN_ID } from '@cashmere-monorepo/backend-blockchain/test/_setup';
import { SwapDataDbDto } from '@cashmere-monorepo/backend-database';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

type NestedKeyOf<ObjectType extends object> = {
    [Key in keyof ObjectType &
        (string | number)]: ObjectType[Key] extends object
        ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
        : `${Key}`;
}[keyof ObjectType & (string | number)];

describe('[Worker][Unit] Bridge - Event handler', () => {
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
        // Mock the database module
        vi.doMock('@cashmere-monorepo/backend-database', () => ({
            getSwapDataRepository: async () => ({
                // TODO: Mocked input for the initial swap data
                get: async (id: string): Promise<SwapDataDbDto | undefined> =>
                    undefined,
                save: async (
                    swapData: SwapDataDbDto
                ): Promise<SwapDataDbDto | undefined> => swapData,
                // TODO: Update the swap data with the given field's
                update: async (
                    swapData: SwapDataDbDto,
                    fields: NestedKeyOf<SwapDataDbDto>[]
                ): Promise<SwapDataDbDto | null> => swapData,
            }),
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
    });
});
