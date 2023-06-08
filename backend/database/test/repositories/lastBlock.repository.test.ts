import { faker } from '@faker-js/faker';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
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
    LastBlockDbDto,
    LastBlockRepository,
    getLastBlockRepository,
} from '../../src';

describe('[Backend][Database] Last block repository', () => {
    let lastBlockRepo: LastBlockRepository;
    let lastBlockFixture: LastBlockDbDto[];
    let mongod: MongoMemoryServer;

    beforeAll(async () => {
        // Start an in-memory MongoDB server
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        // Set the environment variables for the database connection
        vi.stubEnv('MONGO_DB_URI', uri);
        vi.stubEnv('MONGO_DB_NAME', 'testdb');

        // Get the repository, also connects to the database
        lastBlockRepo = await getLastBlockRepository();
    });

    beforeEach(async () => {
        // Generate some users
        lastBlockFixture = Array.from({ length: 30 }, (_, i) => ({
            chainId: faker.number.int({ min: 1, max: 255 }),
            type: i < 15 ? 'bridge' : 'supervisor',
            blockNumber: faker.number.int({ min: 1, max: 255 }),
        }));
        // Insert the generated swap data into the database
        await lastBlockRepo.model.insertMany(lastBlockFixture);
    });

    afterEach(async () => {
        // Clear the collection after each test
        await lastBlockRepo.model.deleteMany({});
    });

    afterAll(async () => {
        // Disconnect from the database, otherwise following test suites will fail
        await mongoose.disconnect();
        // Stop the in-memory MongoDB server
        await mongod.stop();
    });

    it('[Ok] Retrieves a block number by chain id and type', async () => {
        const record = lastBlockFixture[0];
        expect(
            await lastBlockRepo.getForChainAndType(record.chainId, record.type)
        ).toEqual(record.blockNumber);
        expect(
            await lastBlockRepo.getForChainAndType(265, 'supervisor')
        ).toBeUndefined();
    });

    it('[Ok] Updates block number by chain id and type', async () => {
        const record = lastBlockFixture[0];
        await lastBlockRepo.updateForChainAndType(
            record.chainId,
            record.type,
            100500
        );
        expect(
            await lastBlockRepo.model.findOne({
                chainId: record.chainId,
                type: record.type,
            })
        ).toMatchObject({ blockNumber: 100500 });
    });

    it('[Ok] Inserts a record on update if it does not exist', async () => {
        expect(
            await lastBlockRepo.model.findOne({
                chainId: 100500,
                type: 'supervisor',
            })
        ).toBeFalsy();
        await lastBlockRepo.updateForChainAndType(100500, 'supervisor', 100500);
        expect(
            await lastBlockRepo.model.findOne({
                chainId: 100500,
                type: 'supervisor',
            })
        ).toMatchObject({
            chainId: 100500,
            type: 'supervisor',
            blockNumber: 100500,
        });
    });
});
