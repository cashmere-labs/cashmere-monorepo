import {
    buildSstApiGatewayContract,
    CustomType,
} from '@cashmere-monorepo/shared-contract-core/src';
import { Type } from '@sinclair/typebox';
import { SiweMessageType } from './siweMessage';

// TODO: Should create generic type for chain id's, amount, token addresses, etc. (with specific type validation rules, like number etc)

// The schema for the body
export const loginBodyType = Type.Object({
    siweMessage: SiweMessageType,
    signature: CustomType.Hex(),
});

// Typebox schema for the response body
export const loginResponseBodyType = Type.Object({
    accessToken: Type.String(),
    refreshToken: Type.String(),
});

// Get the api path into account when building the contract
// TODO : Maybe an export of the whole API routes contracts, with path? Used by front & back
export const loginContract = buildSstApiGatewayContract({
    id: 'auth-login',
    path: '/auth/login',
    method: 'POST',
    bodySchema: loginBodyType,
    responseSchema: loginResponseBodyType,
});
