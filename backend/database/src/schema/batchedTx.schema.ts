import { HydratedDocument, Schema } from 'mongoose';
import { BatchedTxDbDto } from '../dto';

// Define the user schema
export const BatchedTxSchema = new Schema<BatchedTxDbDto>({
    // Basic info about the tx's
    chainId: { type: Number, required: true, index: true },
    priority: { type: Number, required: true },
    target: { type: String, required: true },
    data: { type: String, required: true },
    securityHash: { type: String, required: true, index: true },

    // Status of the tx
    status: {
        type: {
            type: String,
            enum: ['queued', 'sent'],
            required: true,
        },
        hash: {
            type: String,
            required: false,
        },
    },
});

// The type for a user document
export type BatchedTxSchemaDocument = HydratedDocument<BatchedTxDbDto>;
