import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Model } from 'mongoose';
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
import { StatDataDbDto, StatRepository, getStatRepository } from '../../src';
import { fakerInt, fakerResetCache } from './_utils';
describe('[Backend][Database] User repository', () => {
    let statRepository: StatRepository;
    let statFixture: StatDataDbDto[];
    let mongod: MongoMemoryServer;
    let model: Model<StatDataDbDto>;

    beforeAll(async () => {
        // Start an in-memory MongoDB server
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        // Set the environment variables for the database connection
        vi.stubEnv('MONGO_DB_URI', uri);
        vi.stubEnv('MONGO_DB_NAME', 'testdb');

        // Get the repository, also connects to the database
        statRepository = await getStatRepository();

        // Get the model from mongoose registry
        model = mongoose.model('StatData');
    });

    beforeEach(async () => {
        // Reset faker duplicates cache
        fakerResetCache();
        // Generate some stat data
        statFixture = Array.from({ length: 30 }, (_, i) => ({
            chainId: fakerInt(1, 255),
            transactionCount: fakerInt(100, 2500),
            volume: `$${fakerInt(1000, 2500000)}`,
            fee: `$${fakerInt(1000, 2500000)}`,
            tvl: `$${fakerInt(1000, 2500000)}`,
        }));
        // Insert the generated swap data into the database
        await model.insertMany(statFixture);
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

    describe('Get by chainId', () => {
        it('[Ok] Gets stats by chain id', async () => {
            const stat = statFixture[0];
            expect(
                await statRepository.getByChainId(stat.chainId)
            ).toMatchObject(stat);
        });

        it('[Ok] Gets stats for all chains', async () => {
            const stat = statFixture[0];
            const allStats = (await statRepository.getAll()) || [];
            expect(allStats[0]).toMatchObject(stat);
            expect(allStats.length).toBe(statFixture.length);
        });

        it('[Ok] Updates the stat data partially', async () => {
            const statData = statFixture[0];
            const newStatData: StatDataDbDto = {
                ...statData,
                transactionCount: 10000,
            };

            const expected = {
                ...newStatData,
                transactionCount: newStatData.transactionCount,
            };

            expect(
                await statRepository.update(newStatData, ['transactionCount'])
            ).toMatchObject(expected);

            expect(
                await model
                    .findOne(
                        {
                            chainId: newStatData.chainId,
                        },
                        { _id: 0, __v: 0 }
                    )
                    .lean()
            ).toMatchObject(expected);
        });
    });
});
