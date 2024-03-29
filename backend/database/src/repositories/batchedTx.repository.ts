import { Connection, ObjectId } from 'mongoose';
import { BatchedTxDbDto } from '../dto';
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
    const model = connection.model<BatchedTxDbDto>(
        'BatchedTx',
        BatchedTxSchema
    );
    // Return all the function needed to interact with the batched tx model
    return {
        /**
         * Check if we don't have a tx in queue with the same security hash
         */
        async hasTxWithSecurityHash(securityHash: string) {
            const exists = await model.exists({
                securityHash,
                'status.type': 'queued',
            });
            return exists !== null;
        },

        /**
         * Create a new batched tx
         */
        async create(batchedTx: Omit<BatchedTxDbDto, 'status' | '_id'>) {
            await model.create({
                ...batchedTx,
                status: { type: 'queued' },
            });
        },

        /**
         * Get the txs to send for a given chain
         * @param chainId
         */
        getPendingTxForChain(
            chainId: number
        ): Promise<(BatchedTxDbDto & { _id: ObjectId })[]> {
            return model.find({
                chainId,
                'status.type': 'queued',
            });
        },

        /**
         * Update the status of multiple batched txs
         */
        updateTxsStatus(
            txIds: ObjectId[],
            newStatus: 'sent' | 'failed',
            txHash?: string
        ) {
            return model.updateMany(
                {
                    _id: { $in: txIds },
                },
                {
                    $set: {
                        'status.type': newStatus,
                        'status.hash': txHash,
                    },
                }
            );
        },
    };
};

export type BatchedTxRepository = ReturnType<typeof buildBatchedTxRepository>;
