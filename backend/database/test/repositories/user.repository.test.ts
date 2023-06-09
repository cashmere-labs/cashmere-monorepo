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
import { UserDbDto, UserRepository, getUserRepository } from '../../src';

describe('[Backend][Database] User repository', () => {
    let userRepository: UserRepository;
    let userFixture: UserDbDto[];
    let mongod: MongoMemoryServer;
    let model: Model<UserDbDto>;

    beforeAll(async () => {
        // Start an in-memory MongoDB server
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        // Set the environment variables for the database connection
        vi.stubEnv('MONGO_DB_URI', uri);
        vi.stubEnv('MONGO_DB_NAME', 'testdb');

        // Get the repository, also connects to the database
        userRepository = await getUserRepository();

        // Get the model from mongoose registry
        model = mongoose.model('User');
    });

    beforeEach(async () => {
        // Generate some users
        userFixture = Array.from({ length: 30 }, (_, i) => ({
            address: faker.finance.ethereumAddress() as Address,
            refreshTokenHash:
                i < 15
                    ? (faker.string.hexadecimal({ length: 64 }) as Hex)
                    : undefined,
        }));
        // Insert the generated swap data into the database
        await model.insertMany(userFixture);
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

    describe('Get by address', () => {
        it('[Ok] Gets user by address', async () => {
            const user = userFixture[0];
            expect(
                await userRepository.getByAddress(user.address)
            ).toMatchObject(user);
        });

        it('[Ok] Creates a user if it does not exist', async () => {
            // This address is guaranteed to not exist in the database
            const address = '0xabcd';
            // And it indeed does not exist
            expect(await model.exists({ address })).toBeFalsy();
            // But when we try to get it
            expect(await userRepository.getByAddress(address)).toMatchObject({
                address,
            });
            // It is created
            expect(await model.exists({ address })).toBeTruthy();
        });
    });

    describe('Update refresh token hash', () => {
        it('[Ok] Updates refresh token hash', async () => {
            // Get a user without a refresh token hash
            const user = userFixture[15];
            // Get its address
            const { address } = user;
            // Make sure that the refresh token hash is not set
            expect(
                (await model.findOne({ address }))!.refreshTokenHash
            ).toBeFalsy();
            // Update the refresh token hash
            await userRepository.updateRefreshTokenHash(address, '0x1234');
            // Make sure that the refresh token hash was set
            expect(
                (await model.findOne({ address }))!.refreshTokenHash
            ).toEqual('0x1234');
        });

        it('[Ok] Creates a user if it does not exist', async () => {
            // This address is guaranteed to not exist in the database
            const address = '0xabcd';
            // And it indeed does not exist
            expect(await model.exists({ address })).toBeFalsy();
            // Update the refresh token hash
            await userRepository.updateRefreshTokenHash(address, '0x1234');
            // Make sure that the user was created and refresh token hash was set
            expect(
                (await model.findOne({ address }))!.refreshTokenHash
            ).toEqual('0x1234');
        });
    });
});
