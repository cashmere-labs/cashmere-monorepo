import {
    CustomType,
    buildSstApiGatewayContract,
} from '@cashmere-monorepo/shared-contract-core';
import { Type } from '@sinclair/typebox';

/**
 * Typebox schema for the undetected tx ids query params
 */
const undetectedTxIdsQueryParamsType = Type.Object({
    txIds: Type.Array(CustomType.Hash()),
});

/**
 * Typebox schema for the undetected tx ids response
 */
const undetectedTxIdsResponseBodyType = Type.Array(Type.String());

/**
 * Typebox schema for the undetected tx ids contract
 */
export const undetectedTxIdsContract = buildSstApiGatewayContract({
    id: 'undetected-tx-ids',
    path: '/getUndetectedTxIds',
    method: 'GET',
    queryStringParamsSchema: undetectedTxIdsQueryParamsType,
    responseSchema: undetectedTxIdsResponseBodyType,
});
