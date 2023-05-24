import { buildSstApiGatewayContract } from '@cashmere-monorepo/shared-contract-core';
import { Type } from '@sinclair/typebox';

// Typebox schema for the request query parameters
export const undetectedTxIdsQueryParamsType = Type.Object({
    txIds: Type.String(),
});

// Typebox schema for the response body
export const undetectedTxIdsResponseBodyType = Type.Array(Type.String());

// SST API Gateway contract
export const undetectedTxIdsContract = buildSstApiGatewayContract({
    id: 'undetected-tx-ids',
    path: '/api/getUndetectedTxids',
    method: 'GET',
    queryStringParamsSchema: undetectedTxIdsQueryParamsType,
    responseSchema: undetectedTxIdsResponseBodyType,
});
