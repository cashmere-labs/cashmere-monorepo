import { buildSstApiGatewayContract } from '@cashmere-monorepo/shared-contract-core';
import { Type } from '@sinclair/typebox';

// Typebox schema for the response body
export const healthCheckEndpointResponseBodyType = Type.Object({
    status: Type.String(),
    message: Type.String(),
    timestamp: Type.String(),
});

// Typebox schema for the response body
export const totalSwapsEndpontResponseType = Type.Object({
    status: Type.String(),
    error: Type.Optional(Type.String()),
    total: Type.Optional(Type.Number()),
});

// Typebox schema for the response body
export const listSwapsEndpontResponseType = Type.Object({
    status: Type.String(),
    error: Type.Optional(Type.String()),
    total: Type.Optional(Type.Number()),
    swaps: Type.Optional(
        Type.Array(
            Type.Object({
                id: Type.String(),
                from: Type.String(),
                to: Type.String(),
                amount: Type.Number(),
                timestamp: Type.String(),
            })
        )
    ),
});

// Typebox schema for the response body
// export const totalSwapsQueryStringParamsSchema = Type.Object({
//     page: Type.Optional(Type.String()),
// });

// Typebox schema for the response body
export const listSwapsQueryStringParamsSchema = Type.Object({
    page: Type.Optional(Type.String()),
});

// SST API Gateway contract for the health check endpoint
export const testContract = buildSstApiGatewayContract({
    id: 'test',
    path: '/health-check',
    method: 'GET',
    responseSchema: healthCheckEndpointResponseBodyType,
});

// SST API Gateway contract for the get all swaps endpoint
export const totalSwapContract = buildSstApiGatewayContract({
    id: 'total-swaps',
    path: '/total-swaps',
    method: 'GET',
    // queryStringParamsSchema: totalSwapsQueryStringParamsSchema,
    responseSchema: totalSwapsEndpontResponseType,
});

// SST API Gateway contract for the get list swaps endpoint
export const listSwapContract = buildSstApiGatewayContract({
    id: 'list-swaps',
    path: '/list-swaps',
    method: 'GET',
    queryStringParamsSchema: listSwapsQueryStringParamsSchema,
    responseSchema: totalSwapsEndpontResponseType,
});
