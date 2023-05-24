import { buildSstApiGatewayContract } from '@cashmere-monorepo/shared-contract-core';
import { Type } from '@sinclair/typebox';

// The schema for the query params
export const nonceQueryStringParamsType = Type.Object({
    requestId: Type.String(),
});

// Typebox schema for the response body
export const nonceResponseBodyType = Type.Object({
    nonce: Type.String(),
});

// Get the api path into account when building the contract
// TODO : Maybe an export of the whole API routes contracts, with path? Used by front & back
export const nonceContract = buildSstApiGatewayContract({
    id: 'auth-nonce',
    path: '/auth/nonce',
    method: 'GET',
    queryStringParamsSchema: nonceQueryStringParamsType,
    responseSchema: nonceResponseBodyType,
});
