import { Connection } from 'mongoose';
import { LastBlockType } from '../dto/lastBlock';
import { LastBlockSchema } from '../schema';
import { getMongooseConnection } from '../utils/connection';

/**
 * Our current last block repository (can be null if not initialized yet)
 */
let currentRepository: LastBlockRepository | undefined = undefined;

/**
 * Get the current last block repository
 */
export const getLastBlockRepository =
    async (): Promise<LastBlockRepository> => {
        if (currentRepository) return currentRepository;

        // Get the current connection
        const connection = await getMongooseConnection();
        // Build our repository
        const newRepository: LastBlockRepository =
            buildLastBlockRepository(connection);
        // Save it and return it
        currentRepository = newRepository;
        return newRepository;
    };

/**
 * Build our last block repository
 * @param connection
 */
const buildLastBlockRepository = (connection: Connection) => {
    // Get our user model
    const model = connection.model('LastBlock', LastBlockSchema);
    // Return all the function needed to interact with the user model
    return {
        model,
        /**
         * Get the last block for a given chain and type
         * @param chainId
         * @param type
         */
        async getForChainAndType(chainId: number, type: LastBlockType) {
            const lastBlock = await model.findOne({ chainId, type });
            return lastBlock?.blockNumber;
        },

        /**
         * Update the last block for a given chain and type
         * @param chainId
         * @param type
         * @param blockNumber
         */
        async updateForChainAndType(
            chainId: number,
            type: LastBlockType,
            blockNumber: number
        ) {
            await model.updateOne(
                { chainId, type },
                {
                    $set: { blockNumber },
                    $setOnInsert: { chainId, type },
                },
                { upsert: true }
            );
        },
    };
};

export type LastBlockRepository = ReturnType<typeof buildLastBlockRepository>;
