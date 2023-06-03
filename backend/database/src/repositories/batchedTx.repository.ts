import { Connection } from 'mongoose';
import { BatchedTxSchema } from '../schema';
import { getMongooseConnection } from '../utils/connection';

/**
 * Our current batched tx repository (can be null if not initialized yet)
 */
let currentRepository: BatchedTxRepository | undefined = undefined;

/**
 * Get the current batched tx repository
 */
export const getBatchedTxRepository =
    async (): Promise<BatchedTxRepository> => {
        if (currentRepository) return currentRepository;

        // Get the current connection
        const connection = await getMongooseConnection();
        // Build our repository
        const newRepository: BatchedTxRepository =
            buildBatchedTxRepository(connection);
        // Save it and return it
        currentRepository = newRepository;
        return newRepository;
    };

/**
 * Build our batched tx repository
 * @param connection
 */
const buildBatchedTxRepository = (connection: Connection) => {
    // Get our user model
    const model = connection.model('BatchedTx', BatchedTxSchema);
    // Return all the function needed to interact with the batched tx model
    return {};
};

export type BatchedTxRepository = ReturnType<typeof buildBatchedTxRepository>;
