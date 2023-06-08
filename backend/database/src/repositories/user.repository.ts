import { Connection } from 'mongoose';
import { Address } from 'viem';
import { UserSchema } from '../schema';
import { getMongooseConnection } from '../utils/connection';

/**
 * Our current user repository (can be null if not initialized yet)
 */
let currentRepository: UserRepository | undefined = undefined;

/**
 * Get the current user repository
 */
export const getUserRepository = async (): Promise<UserRepository> => {
    if (currentRepository) return currentRepository;

    // Get the current connection
    const connection = await getMongooseConnection();
    // Build our repository
    const newRepository: UserRepository = buildUserRepository(connection);
    // Save it and return it
    currentRepository = newRepository;
    return newRepository;
};

/**
 * Build our user repository
 * @param connection
 */
const buildUserRepository = (connection: Connection) => {
    // Get our user model
    const model = connection.model('User', UserSchema);
    // Return all the function needed to interact with the user model
    return {
        // Include the model in the repo object, needed for tests
        model,
        /**
         * Get a user object by its address, create if not found
         * @param address
         */
        async getByAddress(address: Address) {
            return model.findOneAndUpdate(
                { address },
                { $setOnInsert: { address } },
                { upsert: true, new: true }
            );
        },

        /**
         * Update the refresh token hash for a given user, create if not found
         * @param address
         * @param refreshTokenHash
         */
        async updateRefreshTokenHash(
            address: Address,
            refreshTokenHash?: string
        ) {
            await model.findOneAndUpdate(
                { address },
                {
                    $set: { refreshTokenHash },
                    $setOnInsert: { address },
                },
                { upsert: true }
            );
        },
    };
};

export type UserRepository = ReturnType<typeof buildUserRepository>;
