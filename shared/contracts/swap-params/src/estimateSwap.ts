import { buildSstApiGatewayContract } from '@cashmere-monorepo/shared-contract-core/src';
import { Static, Type } from '@sinclair/typebox';

// TODO: Should create generic type for chain id's, amount, token addresses, etc.

// The schema for the request query parameters
export const estimateSwapQueryParamsType = Type.Object(
    {
        srcChainId: Type.String({ required: true }),
        dstChainId: Type.String({ required: true }),
        amount: Type.String({ required: true }),
        srcToken: Type.String({ required: true }),
        dstToken: Type.String({ required: true }),
    },
    { required: true }
);
export type EstimateSwapQueryParams = Static<
    typeof estimateSwapQueryParamsType
>;

// The schema for the request event
export const estimateSwapEventType = Type.Object({
    queryStringParameters: estimateSwapQueryParamsType,
});
export type EstimateSwapEvent = Static<typeof estimateSwapEventType>;

// Typebox schema for the response body
export const estimateSwapResponseBodyType = Type.Object(
    {
        dstAmount: Type.String({ required: true }),
        minReceivedDst: Type.String({ required: true }),
        fee: Type.String({ required: true }),
        priceImpact: Type.String({ required: true }),
        nativeFee: Type.String({ required: true }),
    },
    { required: true }
);
export type EstimateSwapResponseBody = Static<
    typeof estimateSwapResponseBodyType
>;

// The schema for the response
export const estimateSwapResponse = Type.Object(
    {
        body: estimateSwapResponseBodyType,
    },
    { required: true }
);
export type EstimateSwapResponse = Static<typeof estimateSwapResponse>;

export const estimateSwapContract = buildSstApiGatewayContract({
    id: 'swap-params-estimate',
    path: '/estimate',
    method: 'GET',
    queryStringParamsSchema: estimateSwapQueryParamsType,
    responseSchema: estimateSwapResponseBodyType,
});
