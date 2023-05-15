import { buildSstApiGatewayContract } from '@cashmere-monorepo/shared-contract-core/src';
import { Type } from '@sinclair/typebox';

// TODO: Should create generic type for chain id's, amount, token addresses, etc. (with specific type validation rules, like number etc)

// The schema for the request query parameters
export const estimateSwapQueryParamsType = Type.Object({
    srcChainId: Type.String(),
    dstChainId: Type.String(),
    amount: Type.String(),
    srcToken: Type.String(),
    dstToken: Type.String(),
});

// Typebox schema for the response body
export const estimateSwapResponseBodyType = Type.Object({
    dstAmount: Type.String(),
    minReceivedDst: Type.String(),
    fee: Type.String(),
    priceImpact: Type.String(),
    nativeFee: Type.String(),
});

// Get the api path into account when building the contract
// TODO : Maybe an export of the whole API routes contracts, with path? Used by front & back
export const estimateSwapContract = buildSstApiGatewayContract({
    id: 'swap-params-estimate',
    path: '/estimate',
    method: 'GET',
    queryStringParamsSchema: estimateSwapQueryParamsType,
    responseSchema: estimateSwapResponseBodyType,
});
