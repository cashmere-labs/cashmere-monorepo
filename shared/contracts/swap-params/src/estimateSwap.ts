import { buildSstApiGatewayContract } from '@cashmere-monorepo/shared-contract-core/src';
import { Type } from '@sinclair/typebox';

// TODO: Should create generic type for chain id's, amount, token addresses, etc. (with specific type validation rules, like number etc)

// The schema for the request query parameters
export const estimateSwapQueryParamsType = Type.Object(
    {
        srcChainId: Type.Number({ required: true }),
        dstChainId: Type.Number({ required: true }),
        amount: Type.BigInt({ required: true }),
        srcToken: Type.String({ required: true }),
        dstToken: Type.String({ required: true }),
    },
    { required: true }
);

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

export const estimateSwapContract = buildSstApiGatewayContract({
    id: 'swap-params-estimate',
    path: '/estimate',
    method: 'GET',
    queryStringParamsSchema: estimateSwapQueryParamsType,
    responseSchema: estimateSwapResponseBodyType,
});
