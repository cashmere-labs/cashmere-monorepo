import { Connection, FilterQuery } from 'mongoose';
import { Hex } from 'viem';
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
        /**
         * Get all the swap data progress for a given address
         */
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
         * Get a swap data from it's id
         */
        async getById(id: Hex): Promise<SwapDataDbDto | undefined> {
            return (await model.findOne({ swapId: id })) ?? undefined;
        },

        /**
         * Add a new swap data in our repository
         */
        async save(swapData: SwapDataDbDto): Promise<SwapDataDbDto> {
            // Save the swap data
            // TODO: Also check for duplicate id & srcChainId?
            return await model.create(swapData);
        },

        /**
         * Add a new swap data in our repository
         */
        async updateSwapDataStatus(
            swapId: string,
            status: SwapDataDbDto['status']
        ) {
            // Update the swap data status
            await model.updateOne({ swapId }, { $set: { status } });
        },

        /**
         * Get all the swap data that need to be checked for completion
         */
        async getWaitingForCompletionsOnDstChainCursor(chainId: number) {
            return model
                .find({
                    'chains.dstChainId': chainId,
                    'status.swapContinueTxid': { $ne: null },
                    'status.swapContinueConfirmed': null,
                })
                .cursor();
        },
    };
};

export type SwapDataRepository = ReturnType<typeof buildSwapDataRepository>;
