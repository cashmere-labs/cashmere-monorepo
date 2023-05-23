import { HydratedDocument, Schema } from 'mongoose';
import { UserDbDto } from '../dto/user';

// Define the user schema
export const UserSchema = new Schema<UserDbDto>({
    address: { type: String, required: true, index: true, unique: true },
    refreshTokenHash: { type: String },
});

// The type for a user document
export type UserSchemaDocument = HydratedDocument<UserDbDto>;
