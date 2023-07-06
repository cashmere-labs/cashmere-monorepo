import { buildSstApiGatewayContract } from '@cashmere-monorepo/shared-contract-core';
import { Type } from '@sinclair/typebox';

// Typebox schema for the response body
export const totalSwapsEndpointResponseType = Type.Object({
    status: Type.String(),
    error: Type.Optional(Type.String()),
    total: Type.Optional(Type.Number()),
});

// SST API Gateway contract for the get all swaps endpoint
export const totalSwapContract = buildSstApiGatewayContract({
    id: 'total-swaps',
    path: '/total-swaps',
    method: 'GET',
    responseSchema: totalSwapsEndpointResponseType,
});
