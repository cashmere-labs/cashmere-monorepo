import { Type } from '@sinclair/typebox';
import { AddressType } from './address';

export const AuthRequestContextType = Type.Object({
    authorizer: Type.Object({
        lambda: Type.Object({
            sub: AddressType(),
        }),
    }),
});
