import { get, set } from 'lodash';
import { Connection, FilterQuery } from 'mongoose';
import { Hash } from 'viem';
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

        /**
         * Marks all the SwapData entries associated with the provided receiver address as hidden.
         *
         * @param address A string representing the receiver address.
         */
        async hideAllSwapIds(address: string) {
            await model.updateMany(
                { receiver: address, swapContinueConfirmed: true },
                { $set: { progressHidden: true } }
            );
        },

        /**
         * Retrieves the SwapData associated with the provided swapId and optionally srcChainId
         * from the database.
         *
         * @param swapId A string representing the swapId to retrieve SwapData for.
         * @param srcChainId An optional number representing the srcChainId to retrieve SwapData for.
         * @returns A Promise that resolves to the retrieved SwapData object.
         */
        async getSwapData(
            swapId: string,
            srcChainId?: number
        ): Promise<SwapDataDbDto | null> {
            const filter: FilterQuery<SwapDataDocument> = { swapId };
            if (srcChainId) filter.srcChainId = srcChainId;
            return await model.findOne(filter);
        },

        /**
         * Updates specified fields of SwapData in the database by swapId and srcChainId.
         * If fields are not specified, updates all the fields.
         *
         * @param swapData An object containing the swap data to update.
         * @param fields An array of field names to update. By default, updates all fields.
         * @returns A Promise that resolves to the updated SwapData object.
         */
        async updateSwapData(
            swapData: SwapDataDbDto,
            fields: string[] = Object.keys(SwapDataSchema.paths) as string[]
        ): Promise<SwapDataDbDto | null> {
            const data: Record<string, unknown> = {};
            fields.forEach((key) => {
                const value = get(swapData, key);
                set(data, key, value);
            });
            return await model.findOneAndUpdate(
                {
                    srcChainId: swapData.chains.srcChainId,
                    swapId: swapData.swapId,
                },
                { $set: data },
                { new: true }
            );
        },

        /**
         * Retrieves a list of initiated transaction hashes that have been discovered in
         * the SwapData collection. This function filters the collection by the provided
         * transaction IDs and returns those which are found.
         *
         * @param txids An array of transaction IDs to search for.
         * @returns A Promise that resolves to an array of transaction hashes that were found.
         */
        async getDiscoveredSwapInitiatedTxids(
            txids: string[]
        ): Promise<Hash[]> {
            const swapData = await model.find(
                {
                    'status.swapInitiatedTxid': { $in: txids },
                },
                'status.swapInitiatedTxid'
            ); // selecting only 'status.swapInitiatedTxid' field

            return swapData
                .filter((sd) => sd.status.swapInitiatedTxid !== undefined) // filter out undefined entries
                .map((sd) => sd.status.swapInitiatedTxid as Hash);
        },
    };
};

export type SwapDataRepository = ReturnType<typeof buildSwapDataRepository>;
