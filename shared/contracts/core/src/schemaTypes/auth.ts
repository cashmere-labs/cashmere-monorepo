import { Type } from '@sinclair/typebox';
import { AddressType } from './address';

// A request context schema for authorizer-protected endpoints
export const AuthRequestContextType = Type.Object({
    authorizer: Type.Object({
        lambda: Type.Object({
            sub: AddressType(),
        }),
    }),
});
