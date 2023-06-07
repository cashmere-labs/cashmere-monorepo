import { HydratedDocument, Schema } from 'mongoose';
import { LastBlockDbDto, UserDbDto } from '../dto';
import { SwapDataSchema } from './swapData.schema';

// Define the user schema
export const LastBlockSchema = new Schema<LastBlockDbDto>({
    chainId: { type: Number, required: true, index: true },
    type: { type: String, required: true },
    blockNumber: { type: Number, required: true },
});

// Add unique index on swap id and src chain id
SwapDataSchema.index({ chainId: 1, type: 1 }, { unique: true });

// The type for a user document
export type LastBlockDocument = HydratedDocument<UserDbDto>;
