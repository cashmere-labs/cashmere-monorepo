import { buildSstApiGatewayContract } from '@cashmere-monorepo/shared-contract-core/src';
import { Type } from '@sinclair/typebox';

/**
 * This is the query params for the estimate swap params API.
 */
const estimateSwapQueryParamsType = Type.Object({
    srcChainId: Type.String(),
    dstChainId: Type.String(),
    amount: Type.String(),
    srcToken: Type.String(),
    dstToken: Type.String(),
});

/**
 * This is the response bodyfor the estimate swap params API.
 */
const estimateSwapResponseBodyType = Type.Object({
    dstAmount: Type.String(),
    minReceivedDst: Type.String(),
    fee: Type.String(),
    priceImpact: Type.String(),
    nativeFee: Type.String(),
});

/**
 * This is a contract for the estimate swap params API.
 */
export const estimateSwapContract = buildSstApiGatewayContract({
    id: 'swap-params-estimate',
    path: '/estimate',
    method: 'GET',
    queryStringParamsSchema: estimateSwapQueryParamsType,
    responseSchema: estimateSwapResponseBodyType,
});
