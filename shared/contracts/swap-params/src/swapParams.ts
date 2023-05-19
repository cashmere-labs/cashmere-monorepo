import { buildSstApiGatewayContract } from '@cashmere-monorepo/shared-contract-core';
import { Type } from '@sinclair/typebox';

// TODO: Should create generic type for chain id's, amount, token addresses, etc. (with specific type validation rules, like number etc)

// The schema for the request query parameters
export const swapParamsQueryParamsType = Type.Object({
    srcChainId: Type.String(),
    dstChainId: Type.String(),
    amount: Type.String(),
    srcToken: Type.String(),
    dstToken: Type.String(),
    receiver: Type.String(),
});

// Typebox schema for the response body
export const swapParamsResponseBodyType = Type.Object({
    args: Type.Object({
        srcToken: Type.String(),
        srcAmount: Type.String(),
        lwsPoolId: Type.String(),
        hgsPoolId: Type.String(),
        dstToken: Type.String(),
        dstChain: Type.String(),
        dstAggregatorAddress: Type.String(),
        minHgsAmount: Type.String(),
    }),
    to: Type.String(),
    value: Type.String(),
    swapData: Type.Any(), // TODO: Add type
});

export const swapParamsContract = buildSstApiGatewayContract({
    id: 'swap-params-params',
    path: '/params',
    method: 'GET',
    queryStringParamsSchema: swapParamsQueryParamsType,
    responseSchema: swapParamsResponseBodyType,
});
