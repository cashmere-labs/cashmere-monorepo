import { buildSstApiGatewayContract } from '@cashmere-monorepo/shared-contract-core';
import { Type } from '@sinclair/typebox';

/**
 * This is the query params for the swap params API.
 */
const swapParamsQueryParamsType = Type.Object({
    srcChainId: Type.String(),
    dstChainId: Type.String(),
    amount: Type.String(),
    srcToken: Type.String(),
    dstToken: Type.String(),
    receiver: Type.String(),
});

/**
 * This is the response body for the swap params API.
 */
const swapParamsResponseBodyType = Type.Object({
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

/**
 * This is a contract for the swap params API.
 */
export const swapParamsContract = buildSstApiGatewayContract({
    id: 'swap-params-params',
    path: '/params',
    method: 'GET',
    queryStringParamsSchema: swapParamsQueryParamsType,
    responseSchema: swapParamsResponseBodyType,
});
