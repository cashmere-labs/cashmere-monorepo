import {
    buildSstApiGatewayContract,
    CustomType,
} from '@cashmere-monorepo/shared-contract-core';
import { Type } from '@sinclair/typebox';

/**
 * Typebox schema for the response body
 */
const refreshResponseBodyType = Type.Object({
    accessToken: Type.String(),
    refreshToken: Type.String(),
});

/**
 * Contract for the refresh endpoint
 */
export const refreshContract = buildSstApiGatewayContract({
    id: 'auth-refresh',
    path: '/auth/refresh',
    method: 'POST',
    responseSchema: refreshResponseBodyType,
    requestContextSchema: CustomType.AuthRequestContext,
});
