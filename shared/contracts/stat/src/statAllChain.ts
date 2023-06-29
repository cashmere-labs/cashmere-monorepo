import { buildSstApiGatewayContract } from '@cashmere-monorepo/shared-contract-core';
import { Type } from '@sinclair/typebox';

// Typebox schema for the response body
export const statAllChainEndpointResponseType = Type.Object({
    stats: Type.Optional(Type.Array(Type.Any())),
});

// SST API Gateway contract for the get list swaps endpoint
export const statAllChainContract = buildSstApiGatewayContract({
    id: 'stat-data',
    path: '/stat-data',
    method: 'GET',
    responseSchema: statAllChainEndpointResponseType,
});
