import { buildSstApiGatewayContract } from '@cashmere-monorepo/shared-contract-core';
import { TObject, Type } from '@sinclair/typebox';

// Typebox schema for the response body
export const listSwapsEndpointResponseType: TObject = Type.Object({
    status: Type.String(),
    error: Type.Optional(Type.String()),
    total: Type.Optional(Type.Number()),
    swaps: Type.Optional(Type.Array(Type.Any())),
});

// Typebox schema for the response body
export const listSwapsQueryStringParamsSchema: TObject = Type.Object({
    page: Type.Optional(Type.String()),
});

// SST API Gateway contract for the get list swaps endpoint
export const listSwapContract: any = buildSstApiGatewayContract({
    id: 'list-swaps',
    path: '/list-swaps',
    method: 'GET',
    queryStringParamsSchema: listSwapsQueryStringParamsSchema,
    responseSchema: listSwapsEndpointResponseType,
});
