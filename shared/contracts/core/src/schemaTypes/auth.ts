import { Type } from '@sinclair/typebox';
import { AddressType } from './address';

// A request context schema for authorizer-protected endpoints
export const AuthRequestContextType = Type.Object({
    authorizer: Type.Object({
        lambda: Type.Object({
            // Can't use custom type here because of circular dependency
            sub: AddressType(),
        }),
    }),
});
