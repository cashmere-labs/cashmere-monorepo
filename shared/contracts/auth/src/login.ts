import {
    buildSstApiGatewayContract,
    CustomType,
} from '@cashmere-monorepo/shared-contract-core/src';
import { Type } from '@sinclair/typebox';
import { SiweMessageType } from './utils/siweMessage';

/**
 * Typebox schema for the request body
 */
const loginBodyType = Type.Object({
    siweMessage: SiweMessageType,
    signature: CustomType.Hex(),
});

/**
 * Typebox schema for the response body
 */
const loginResponseBodyType = Type.Object({
    accessToken: Type.String(),
    refreshToken: Type.String(),
});

/**
 * Contract for the login endpoint
 */
export const loginContract = buildSstApiGatewayContract({
    id: 'auth-login',
    path: '/auth/login',
    method: 'POST',
    bodySchema: loginBodyType,
    responseSchema: loginResponseBodyType,
});
