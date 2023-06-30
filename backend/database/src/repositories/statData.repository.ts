import { StatDataDbDto } from 'dto/statData';
import { get } from 'lodash';
import { Connection } from 'mongoose';
import { StatDataSchema } from '../schema';
import { getMongooseConnection } from '../utils/connection';
import { NestedKeyOf } from './swapData.repository';

/**
 * Our current user repository (can be null if not initialized yet)
 */
let currentRepository: StatRepository | undefined = undefined;

/**
 * Get the current user repository
 */
export const getStatRepository = async (): Promise<StatRepository> => {
    if (currentRepository) return currentRepository;

    // Get the current connection
    const connection = await getMongooseConnection();
    // Build our repository
    const newRepository: StatRepository = buildStatRepository(connection);
    // Save it and return it
    currentRepository = newRepository;
    return newRepository;
};

/**
 * Build our user repository
 * @param connection
 */
const buildStatRepository = (connection: Connection) => {
    // Get our user model
    const model = connection.model('StatData', StatDataSchema);
    // Return all the function needed to interact with the user model
    return {
        /**
         * Retrieves the StatData associated with the provided chainId
         * from the database.
         *
         * @param chainId A number representing the chainId to retrieve StatData for.
         * @returns A Promise that resolves to the retrieved StatData object.
         */
        async getByChainId(chainId: number): Promise<StatDataDbDto | null> {
            return model.findOne({ chainId });
        },

        /**
         * Retrieves the StatData for all chainIds.
         * from the database.
         *
         * @returns A Promise that resolves to the retrieved StatData object.
         */
        async getAll(): Promise<StatDataDbDto[] | null> {
            return model.find({}, { _id: 0, __v: 0 });
        },

        /**
         * Updates specified fields of StatData in the database by chainId.
         * If fields are not specified, updates all the fields.
         *
         * @param statData An object containing the stat data to update.
         * @returns A Promise that resolves to the updated StatData object.
         */
        async update(
            statData: StatDataDbDto,
            fields: NestedKeyOf<StatDataDbDto>[]
        ): Promise<StatDataDbDto | null> {
            const data: Record<string, unknown> = {};
            fields.forEach((key) => {
                data[key] = get(statData, key as string);
            });
            return model.findOneAndUpdate(
                { chainId: statData.chainId },
                { $set: data },
                { new: true }
            );
        },
    };
};

export type StatRepository = ReturnType<typeof buildStatRepository>;
