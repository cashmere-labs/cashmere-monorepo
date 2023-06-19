import {
    CrossChainSwapInitiatedLogType,
    l0ChainIdToConfigMapViem,
    networkConfigs,
    SwapMessageReceivedLogType,
    SwapPayload,
} from '@cashmere-monorepo/backend-blockchain';
import { TEST_CHAIN_ID } from '@cashmere-monorepo/backend-blockchain/test/_setup';
import { SwapDataDbDto } from '@cashmere-monorepo/backend-database';
import { getAddress, Hex } from 'viem';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

type NestedKeyOf<ObjectType extends object> = {
    [Key in keyof ObjectType &
        (string | number)]: ObjectType[Key] extends object
        ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
        : `${Key}`;
}[keyof ObjectType & (string | number)];

// Mocked swap data db dto
const mockedSwapDataDbDto: SwapDataDbDto = {
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
};

describe('[Worker][Unit] Bridge - Event handler', () => {
    // Do we mock the swap data
    let mockSwapData = true;
    let isValidDstContractAddress = true;

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
            getSwapDataRepository: () => ({
                // TODO: Mocked input for the initial swap data
                get: async (id: string): Promise<SwapDataDbDto | undefined> =>
                    mockSwapData ? mockedSwapDataDbDto : undefined,
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
                isContractAddress: () => true,
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
            getBridgeRepository: () => vi.fn(),
            // Swap payload
            SwapPayload: SwapPayload,
            // Chain id mapping mock
            l0ChainIdToConfigMapViem: l0ChainIdToConfigMapViem,
            // network configs mock
            networkConfigs: networkConfigs,
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

        it('[Ok] - Should find swap data from db', async () => {
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
                    dstChainId: 1,
                    id: '0xacab',
                    amount: 13n,
                    fee: 13n,
                },
            });
            // Ensure it's undefined
            expect(result).to.be.undefined;
        });
    });
});
