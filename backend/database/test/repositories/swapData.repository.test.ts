import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Error, Model } from 'mongoose';
import { Address, Hash } from 'viem';
import {
    afterAll,
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import {
    SwapDataDbDto,
    SwapDataRepository,
    getSwapDataRepository,
} from '../../src';
import {
    fakerEthereumAddress,
    fakerHexadecimalString,
    fakerInt,
    fakerNumericString,
    fakerResetCache,
} from './_utils';

const PLACEHOLDER: Address = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

const buildFakeSwapData = (i = 0) => ({
    swapId: fakerHexadecimalString(64),
    chains: {
        srcChainId: fakerInt(1, 255),
        dstChainId: fakerInt(1, 255),
        srcL0ChainId: fakerInt(1, 255),
        dstL0ChainId: fakerInt(1, 255),
    },
    path: {
        lwsPoolId: fakerInt(1, 255),
        hgsPoolId: fakerInt(1, 255),
        hgsAmount: fakerNumericString(10),
        dstToken: fakerEthereumAddress(),
        minHgsAmount: fakerNumericString(10),
        fee: '0',
    },
    user: {
        receiver: i < 15 ? PLACEHOLDER : fakerEthereumAddress(),
        signature: fakerHexadecimalString(64),
    },
    status: {
        swapInitiatedTimestamp: 100 - i, // for correct sorting
        swapInitiatedTxid: fakerHexadecimalString(64),
    },
    progress: {},
});

describe('[Backend][Database] SwapData repository', () => {
    let swapDataRepository: SwapDataRepository;
    let swapDataFixture: SwapDataDbDto[];
    let mongod: MongoMemoryServer;
    let model: Model<SwapDataDbDto>;

    beforeAll(async () => {
        // Start an in-memory MongoDB server
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        // Set the environment variables for the database connection
        vi.stubEnv('MONGO_DB_URI', uri);
        vi.stubEnv('MONGO_DB_NAME', 'testdb');

        // Get the repository, also connects to the database
        swapDataRepository = await getSwapDataRepository();

        // Get the model from mongoose registry
        model = mongoose.model('SwapData');
    });

    beforeEach(async () => {
        // Reset faker duplicates cache
        fakerResetCache();
        // Generate some swap data
        swapDataFixture = Array.from({ length: 30 }, (_, i) =>
            buildFakeSwapData(i)
        );
        // Insert the generated swap data into the database
        await model.insertMany(swapDataFixture);
    });

    afterEach(async () => {
        // Clear the collection after each test
        await model.deleteMany({});
    });

    afterAll(async () => {
        // Disconnect from the database, otherwise following test suites will fail
        await mongoose.disconnect();
        // Stop the in-memory MongoDB server
        await mongod.stop();
    });

    describe('Swap data by receiver', () => {
        it('[Ok] Returns swap datas for a given user', async () => {
            const { count, items } = await swapDataRepository.getByReceiver(
                PLACEHOLDER
            );
            // Should return total of 15 items
            expect(count).toEqual(15);
            // Which are in the second half of the fixture
            expect(items).toMatchObject(swapDataFixture.slice(0, 15));
        });

        it('[Ok] Returns swap datas for a given user with pagination', async () => {
            let { count, items } = await swapDataRepository.getByReceiver(
                PLACEHOLDER,
                {},
                0
            );
            // Should return total of 15 items
            expect(count).toEqual(15);
            // But the first page should only contain items 0..9
            expect(items).toMatchObject(swapDataFixture.slice(0, 10));

            ({ count, items } = await swapDataRepository.getByReceiver(
                PLACEHOLDER,
                {},
                1
            ));
            // Total count should be the same
            expect(count).toEqual(15);
            // But the second page should only contain items 10..14
            expect(items).toMatchObject(swapDataFixture.slice(10, 15));
        });

        it('[Ok] Applies additional filters', async () => {
            let { count, items } = await swapDataRepository.getByReceiver(
                PLACEHOLDER,
                {
                    'path.dstToken': swapDataFixture[0].path.dstToken,
                }
            );
            // Should return total of 1 item
            expect(count).toEqual(1);
            // Which is the first item in the fixture
            expect(items).toMatchObject(swapDataFixture.slice(0, 1));
        });
    });

    it('[Ok] Hides all progress data for a user', async () => {
        // Make 10 (timestamp = 91..100) swap datas match the hide filter
        await model.updateMany(
            {
                'user.receiver': PLACEHOLDER,
                'status.swapInitiatedTimestamp': { $gt: 90 },
            },
            { $set: { 'status.swapContinueConfirmed': true } }
        );
        // Hide eligible swap datas for the user
        await swapDataRepository.hideAllSwapIds(PLACEHOLDER);
        // Make sure that these 10 items are hidden
        expect(
            await model
                .find({
                    'user.receiver': PLACEHOLDER,
                    'status.progressHidden': true,
                })
                .count()
        ).toEqual(10);
        // And remaining 5 are untouched
        expect(
            await model
                .find({
                    'user.receiver': PLACEHOLDER,
                    'status.progressHidden': null,
                })
                .count()
        ).toEqual(5);
    });

    it('[Ok] Retrieves the swap data', async () => {
        // Get by swap id
        expect(
            await swapDataRepository.get(swapDataFixture[0].swapId)
        ).toMatchObject(swapDataFixture[0]);
        // Returns falsy value if swap data does not exist
        expect(
            await swapDataRepository.get(swapDataFixture[0].swapId + 'abc')
        ).toBeFalsy();
    });

    it('[Ok] Updates the swap data partially', async () => {
        const swapData = swapDataFixture[0];
        const newSwapData: SwapDataDbDto = {
            ...swapData,
            chains: {
                ...swapData.chains,
                dstL0ChainId: -1,
            },
            status: {
                ...swapData.status,
                swapContinueConfirmed: true,
            },
        };
        const expected = {
            ...newSwapData,
            status: {
                ...newSwapData.status,
            },
        };
        delete expected.status.swapContinueConfirmed;
        // Updates only the specified fields and returns the new object
        expect(
            await swapDataRepository.update(newSwapData, [
                'chains.dstL0ChainId',
            ])
        ).toMatchObject(expected);
        // And it is updated in the database
        expect(
            await model.findOne({
                swapId: newSwapData.swapId,
            })
        ).toMatchObject(expected);
    });

    it('[Ok] Filters out txid list to return only discovered ones', async () => {
        // Get the first 15 txids from the fixture and add 15 random txids
        const txidList = swapDataFixture
            .slice(0, 15)
            .map((sd) => sd.status.swapInitiatedTxid as Hash)
            .concat(new Array(15).map(() => fakerHexadecimalString(64)));
        // Returns only the txids that are in the database
        expect(
            await swapDataRepository.getDiscoveredSwapInitiatedTxids(txidList)
        ).toEqual(txidList.slice(0, 15));
    });

    describe('Save swap data', () => {
        it('[Ok] Saves swap data', async () => {
            const newSwapData = buildFakeSwapData();
            // Make sure that the generated object does not exist
            expect(
                await model.findOne({
                    swapId: newSwapData.swapId,
                })
            ).toBeFalsy();
            // Save the generated object, it should be returned
            expect(await swapDataRepository.save(newSwapData)).toMatchObject(
                newSwapData
            );
            // Check that the object was created
            expect(
                await model.findOne({
                    swapId: newSwapData.swapId,
                })
            ).toMatchObject(newSwapData);
        });

        it("[Ok] Returns undefined when there's a duplicate", async () => {
            const newSwapData = buildFakeSwapData();
            // Make sure that the generated object does not exist
            expect(
                await model.findOne({
                    swapId: newSwapData.swapId,
                })
            ).toBeFalsy();
            // Save the object
            await swapDataRepository.save(newSwapData);
            // The following attempt should return undefined
            expect(await swapDataRepository.save(newSwapData)).toBeUndefined();
            // And not create another copy of the object
            expect(
                await model.count({
                    swapId: newSwapData.swapId,
                })
            ).toEqual(1);
        });

        it('[Fail] Re-throws an error for any other error', async () => {
            await expect(
                swapDataRepository.save({} as any)
            ).rejects.toThrowError(Error.ValidationError);
        });
    });

    it('[Ok] Returns a "get waiting for completions on dst chain" cursor', async () => {
        // Make 10 (timestamp = 91..100) swap datas match the filter
        await model.updateMany(
            {
                'user.receiver': PLACEHOLDER,
                'status.swapInitiatedTimestamp': { $gt: 90 },
            },
            {
                $set: {
                    'chains.dstChainId': 100500,
                    'status.swapContinueTxid': 'aaa',
                },
            }
        );

        // Get the cursor
        const cursor =
            await swapDataRepository.getWaitingForCompletionsOnDstChainCursor(
                100500
            );
        // Check its class
        expect(cursor.constructor.name).toEqual('QueryCursor'); // because mongoose does not export this class, at least in type definitions
        // And count the objects to make sure the filter is correct
        let count = 0;
        while (await cursor.next()) count++;
        expect(count).toEqual(10);
    });
});
