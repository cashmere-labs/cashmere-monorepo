import { faker } from '@faker-js/faker';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Model } from 'mongoose';
import { Address, Hex } from 'viem';
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
    BatchedTxDbDto,
    BatchedTxRepository,
    getBatchedTxRepository,
} from '../../src';

const buildFakeBatchedTx = (i = 0) => ({
    chainId: faker.number.int({ min: 1, max: 255 }),
    priority: faker.number.int({ min: 1, max: 255 }),
    target: faker.finance.ethereumAddress() as Address,
    data: faker.string.hexadecimal({ length: 64 }) as Hex,
    securityHash: faker.string.uuid(),
    status:
        i < 15
            ? {
                  type: 'queued' as 'queued',
              }
            : {
                  type: 'sent' as 'sent',
                  hash: faker.string.hexadecimal({ length: 64 }) as Hex,
              },
});

describe('[Backend][Database] Batched tx repository', () => {
    let batchedTxRepo: BatchedTxRepository;
    let batchedTxFixture: BatchedTxDbDto[];
    let mongod: MongoMemoryServer;
    let model: Model<BatchedTxDbDto>;

    beforeAll(async () => {
        // Start an in-memory MongoDB server
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        // Set the environment variables for the database connection
        vi.stubEnv('MONGO_DB_URI', uri);
        vi.stubEnv('MONGO_DB_NAME', 'testdb');

        // Get the repository, also connects to the database
        batchedTxRepo = await getBatchedTxRepository();

        // Get the model from mongoose registry
        model = mongoose.model('BatchedTx');
    });

    beforeEach(async () => {
        // Generate some users
        batchedTxFixture = Array.from({ length: 30 }, (_, i) =>
            buildFakeBatchedTx(i)
        );
        // Insert the generated swap data into the database
        await model.insertMany(batchedTxFixture);
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

    describe('Has tx with security hash', () => {
        it('[Ok] Returns true if one exists', async () => {
            expect(
                await batchedTxRepo.hasTxWithSecurityHash(
                    batchedTxFixture[0].securityHash
                )
            ).to.be.true;
        });
        it('[Ok] Returns false if one does not exist', async () => {
            // This security hash is guaranteed to not exist
            expect(await batchedTxRepo.hasTxWithSecurityHash('abc')).to.be
                .false;
        });
    });

    it('[Ok] Creates a batched tx', async () => {
        // Build a tx with status = sent
        const fakeTx = buildFakeBatchedTx(30);
        // Save it
        await batchedTxRepo.create(fakeTx);
        // It should've been saved with status = queued
        expect(
            await model.findOne({
                securityHash: fakeTx.securityHash,
            })
        ).toMatchObject({
            ...fakeTx,
            status: { type: 'queued' },
        });
    });

    it('[Ok] Retrieves pending txs for a chain', async () => {
        // Set chain ids
        await model.updateMany({}, { $set: { chainId: 42 } });
        // Check the count of items returned by the tested method
        expect(await batchedTxRepo.getPendingTxForChain(42)).toHaveLength(15);
    });
});
