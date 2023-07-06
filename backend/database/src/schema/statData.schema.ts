import { HydratedDocument, Schema } from 'mongoose';
import { StatDataDbDto } from '../dto/statData';

/**
 * Define the swap data schema
 */
export const StatDataSchema = new Schema<StatDataDbDto>({
    chainId: { type: Number, required: true, index: true },
    transactionCount: { type: Number, required: true },
    volume: { type: String, required: true },
    fee: { type: String, required: true },
    tvl: { type: String, required: true },
});

// Add unique index on swap id and src chain id
StatDataSchema.index({ chainId: 1, type: 1 }, { unique: true });

// The type for our swap data document
export type StatDataDocument = HydratedDocument<StatDataDbDto>;
