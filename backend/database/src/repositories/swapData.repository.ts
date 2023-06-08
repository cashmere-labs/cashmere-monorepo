import { get } from 'lodash';
import { Connection, FilterQuery } from 'mongoose';
import { Address, Hash } from 'viem';
import { SwapDataDbDto } from '../dto/swapData';
import { SwapDataDocument, SwapDataSchema } from '../schema/swapData.schema';
import { getMongooseConnection } from '../utils/connection';

type NestedKeyOf<ObjectType extends object> = {
    [Key in keyof ObjectType &
        (string | number)]: ObjectType[Key] extends object
        ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
        : `${Key}`;
}[keyof ObjectType & (string | number)];

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
        // Include the model in the repo object, needed for tests
        model,
        // Get all the swap data progress for a given address
        async getByReceiver(
            receiver: string,
            filters: Omit<FilterQuery<SwapDataDocument>, 'receiver'> = {},
            page?: number // zero-based
        ): Promise<{ count: number; items: SwapDataDbDto[] }> {
            // Create the query
            let query = model.find({ 'user.receiver': receiver, ...filters });
            // Clone the query and save total documents count
            const count = await query.clone().count();
            // If pagination is requested, add it to the query
            if (page !== undefined) query = query.skip(10 * page).limit(10);
            // Execute the query and return the result
            return {
                count,
                items: await query
                    .sort({ 'status.swapInitiatedTimestamp': -1 })
                    .exec(),
            };
        },

        /**
         * Marks all the SwapData entries associated with the provided receiver address as hidden.
         *
         * @param address A string representing the receiver address.
         */
        async hideAllSwapIds(address: Address) {
            await model.updateMany(
                {
                    'user.receiver': address,
                    'status.swapContinueConfirmed': true,
                },
                { $set: { 'status.progressHidden': true } }
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
            if (srcChainId) filter['chains.srcChainId'] = srcChainId;
            return model.findOne(filter);
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
            fields: NestedKeyOf<SwapDataDbDto>[] = Object.keys(
                SwapDataSchema.paths
            ) as NestedKeyOf<SwapDataDbDto>[]
        ): Promise<SwapDataDbDto | null> {
            const data: Record<string, unknown> = {};
            fields.forEach((key) => {
                data[key] = get(swapData, key as string);
            });
            return model.findOneAndUpdate(
                {
                    'chains.srcChainId': swapData.chains.srcChainId,
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
        async getDiscoveredSwapInitiatedTxids(txids: Hash[]): Promise<Hash[]> {
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
