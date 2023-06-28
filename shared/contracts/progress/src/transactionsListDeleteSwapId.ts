import {
    buildSstApiGatewayContract,
    CustomType,
} from '@cashmere-monorepo/shared-contract-core';
import { Type } from '@sinclair/typebox';

/**
 * Typebox schema for the transactions list delete query params
 */
const transactionsListDeleteSwapIdParamsType = Type.Object({
    swapId: CustomType.Hex(),
});

/**
 * Typebox schema for the transactions list delete response
 */
const transactionsListDeleteSwapIdResponseBodyType = Type.Object({
    message: Type.String(),
});

/**
 * Typebox schema for the transactions list delete query params
 */
export const transactionsListDeleteSwapIdContract = buildSstApiGatewayContract({
    id: 'transactions-list-delete-swap-id',
    path: '/api/transactionsList/:swapId',
    method: 'DELETE',
    requestContextSchema: CustomType.AuthRequestContext,
    pathParamsSchema: transactionsListDeleteSwapIdParamsType,
    responseSchema: transactionsListDeleteSwapIdResponseBodyType,
});
