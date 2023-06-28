import { buildSstApiGatewayContract } from '@cashmere-monorepo/shared-contract-core';
import { Type } from '@sinclair/typebox';

/**
 * The schema for the query string parameters
 */
const nonceQueryStringParamsType = Type.Object({
    requestId: Type.String(),
});

/**
 * The schema for the response body
 */
const nonceResponseBodyType = Type.Object({
    nonce: Type.String(),
});

/**
 * Contract for the nonce endpoint
 */
export const nonceContract = buildSstApiGatewayContract({
    id: 'auth-nonce',
    path: '/auth/nonce',
    method: 'GET',
    queryStringParamsSchema: nonceQueryStringParamsType,
    responseSchema: nonceResponseBodyType,
});
