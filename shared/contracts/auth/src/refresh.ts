import {
    buildSstApiGatewayContract,
    CustomType,
} from '@cashmere-monorepo/shared-contract-core';
import { Type } from '@sinclair/typebox';

// The schema for the response body
export const refreshResponseBodyType = Type.Object({
    accessToken: Type.String(),
    refreshToken: Type.String(),
});

// Get the api path into account when building the contract
// TODO : Maybe an export of the whole API routes contracts, with path? Used by front & back
export const refreshContract = buildSstApiGatewayContract({
    id: 'auth-refresh',
    path: '/auth/refresh',
    method: 'POST',
    responseSchema: refreshResponseBodyType,
    requestContextSchema: CustomType.AuthRequestContext,
});
