import { faker } from '@faker-js/faker';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { Address, Hash, Hex } from 'viem';
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

const PLACEHOLDER = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

describe('[Backend][Database] SwapData repository', () => {
    let swapDataRepository: SwapDataRepository;
    let swapDataFixture: SwapDataDbDto[];
    let mongod: MongoMemoryServer;

    beforeAll(async () => {
        // Start an in-memory MongoDB server
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        // Set the environment variables for the database connection
        vi.stubEnv('MONGO_DB_URI', uri);
        vi.stubEnv('MONGO_DB_NAME', 'testdb');

        // Get the repository, also connects to the database
        swapDataRepository = await getSwapDataRepository();
    });

    beforeEach(async () => {
        // Generate some swap data
        swapDataFixture = Array.from({ length: 30 }, (_, i) => ({
            swapId: faker.string.hexadecimal({ length: 64 }) as Hex,
            chains: {
                srcChainId: faker.number.int({ min: 1, max: 256 }),
                dstChainId: faker.number.int({ min: 1, max: 256 }),
                srcL0ChainId: faker.number.int({ min: 1, max: 256 }),
                dstL0ChainId: faker.number.int({ min: 1, max: 256 }),
            },
            path: {
                lwsPoolId: faker.number.int({ min: 1, max: 256 }),
                hgsPoolId: faker.number.int({ min: 1, max: 256 }),
                hgsAmount: faker.string.numeric({ length: 10 }),
                dstToken: faker.finance.ethereumAddress() as Address,
                minHgsAmount: faker.string.numeric({ length: 10 }),
                fee: '0',
            },
            user: {
                receiver: (i < 15
                    ? PLACEHOLDER
                    : faker.finance.ethereumAddress()) as Address,
                signature: faker.string.hexadecimal({ length: 64 }) as Hex,
            },
            status: {
                swapInitiatedTimestamp: 100 - i, // for correct sorting
                swapInitiatedTxid: faker.string.hexadecimal({
                    length: 64,
                }) as Hex,
            },
            progress: {},
        }));
        // Insert the generated swap data into the database
        await swapDataRepository.model.insertMany(swapDataFixture);
    });

    afterEach(async () => {
        // Clear the collection after each test
        await swapDataRepository.model.deleteMany({});
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
        await swapDataRepository.model.updateMany(
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
            await swapDataRepository.model
                .find({
                    'user.receiver': PLACEHOLDER,
                    'status.progressHidden': true,
                })
                .count()
        ).toEqual(10);
        // And remaining 5 are untouched
        expect(
            await swapDataRepository.model
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
            await swapDataRepository.getSwapData(swapDataFixture[0].swapId)
        ).toMatchObject(swapDataFixture[0]);
        // Get by swap id and src chain id
        expect(
            await swapDataRepository.getSwapData(
                swapDataFixture[0].swapId,
                swapDataFixture[0].chains.srcChainId
            )
        ).toMatchObject(swapDataFixture[0]);
        // Returns falsy value if swap data does not exist
        expect(
            await swapDataRepository.getSwapData(
                swapDataFixture[0].swapId,
                swapDataFixture[0].chains.srcChainId + 1
            )
        ).toBeFalsy();
    });

    describe('Update swap data', () => {
        it('[Ok] Updates the swap data', async () => {
            const swapData = swapDataFixture[0];
            const newSwapData = {
                ...swapData,
                status: {
                    ...swapData.status,
                    swapContinueConfirmed: true,
                },
            };
            // Returns the new object
            expect(
                await swapDataRepository.updateSwapData(newSwapData)
            ).toMatchObject(newSwapData);
            // And it is updated in the database
            expect(
                await swapDataRepository.model.findOne({
                    swapId: swapData.swapId,
                })
            ).toMatchObject(newSwapData);
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
                await swapDataRepository.updateSwapData(newSwapData, [
                    'chains.dstL0ChainId',
                ])
            ).toMatchObject(expected);
            // And it is updated in the database
            expect(
                await swapDataRepository.model.findOne({
                    swapId: newSwapData.swapId,
                })
            ).toMatchObject(expected);
        });
    });

    it('[Ok] Filters out txid list to return only discovered ones', async () => {
        // Get the first 15 txids from the fixture and add 15 random txids
        const txidList = swapDataFixture
            .slice(0, 15)
            .map((sd) => sd.status.swapInitiatedTxid as Hash)
            .concat(
                new Array(15).map(
                    () => faker.string.hexadecimal({ length: 64 }) as Hex
                )
            );
        // Returns only the txids that are in the database
        expect(
            await swapDataRepository.getDiscoveredSwapInitiatedTxids(txidList)
        ).toEqual(txidList.slice(0, 15));
    });
});
