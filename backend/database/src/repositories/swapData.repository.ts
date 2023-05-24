import { Connection, FilterQuery } from 'mongoose';
import { SwapDataDbDto } from '../dto/swapData';
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
        ): Promise<{ count: number; items: SwapDataDbDto[] }> {
            const count = await model
                .find({ receiver, ...filters })
                .countDocuments();
            let cursor = model.find({ receiver, ...filters });
            if (page !== undefined) cursor = cursor.skip(10 * page).limit(10);
            return {
                count,
                items: await cursor.sort({ swapInitiatedTimestamp: -1 }).exec(),
            };
        },

        // Hide all the swap Ids. This achives the same effect to deleting all transactions list
        async hideAllSwapIds(address: string) {
            await model.updateMany(
                { receiver: address, swapContinueConfirmed: true },
                { $set: { progressHidden: true } }
            );
        },

        // Get SwapData by swapId and optionally by srcChainId
        async getSwapData(
            swapId: string,
            srcChainId?: number
        ): Promise<SwapDataDbDto | null> {
            const filter: FilterQuery<SwapDataDocument> = { swapId };
            if (srcChainId) filter.srcChainId = srcChainId;
            return await model.findOne(filter);
        },

        // Update SwapData by swapId and srcChainId, updating only specified fields
        async updateSwapData(
            swapData: SwapDataDbDto,
            fields: (keyof SwapDataDbDto)[] = Object.keys(
                SwapDataSchema.paths
            ) as (keyof SwapDataDbDto)[]
        ): Promise<SwapDataDbDto | null> {
            const data: Record<string, unknown> = {};
            fields.forEach((key) => (data[key] = swapData[key]));
            return await model.findOneAndUpdate(
                {
                    srcChainId: swapData.chains.srcChainId,
                    swapId: swapData.swapId,
                },
                { $set: data },
                { new: true }
            );
        },
    };
};

export type SwapDataRepository = ReturnType<typeof buildSwapDataRepository>;
