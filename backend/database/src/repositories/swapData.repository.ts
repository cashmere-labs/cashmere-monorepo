import { Connection, FilterQuery } from 'mongoose';
import { SwapDataDocument, SwapDataSchema } from '../schema/swapData.schema';
import { getMongooseConnection } from '../utils/connection';

/**
 * Our current swap data repository (can be null if not init yet)
 */
let currentRepository: SwapDataRepository | undefined = undefined;

/**
 * Get the current swap data repository
 */
export const getSwapDataRepository = async (): Promise<SwapDataRepository> => {
    if (currentRepository) return currentRepository;

    // Get the current connection
    const connection = await getMongooseConnection();
    // Build our repository
    const newRepository = buildSwapDataRepository(connection);
    // Save it and return it
    currentRepository = newRepository;
    return newRepository;
};

/**
 * Build our swap data repository
 * @param connection
 */
const buildSwapDataRepository = (connection: Connection) => {
    // Get our swap data model
    const model = connection.model('SwapData', SwapDataSchema);
    // Return all the function needed to interact with the swap data
    return {
        // Get all the swap data progress for a given address
        async getByReceiver(
            receiver: string,
            filters: Omit<FilterQuery<SwapDataDocument>, 'receiver'> = {},
            page?: number // zero-based
        ) {
            const count = model.find({ receiver, ...filters }).count();
            let cursor = model.find({ receiver, ...filters });
            if (page !== undefined) cursor = cursor.skip(10 * page).limit(10);
            return {
                count,
                items: await cursor.sort({ swapInitiatedTimestamp: -1 }),
            };
        },
    };
};

export type SwapDataRepository = ReturnType<typeof buildSwapDataRepository>;