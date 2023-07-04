import { buildSstApiGatewayContract } from '@cashmere-monorepo/shared-contract-core';
import { TObject, Type } from '@sinclair/typebox';

// Typebox schema for the response body
export const statByChainEndpointResponseType = Type.Object({
    stats: Type.Object({}),
});

// The schema for the request path parameters
export const statByChainIdQueryParamsType: TObject = Type.Object({
    chainId: Type.Optional(Type.String()),
});

// SST API Gateway contract for the get list swaps endpoint
export const statByChainContract: any = buildSstApiGatewayContract({
    id: 'stat-data-by-chain-id',
    path: '/stat-by-chain',
    method: 'GET',
    queryStringParamsSchema: statByChainIdQueryParamsType,
    responseSchema: statByChainEndpointResponseType,
});
