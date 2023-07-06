import {
    buildSstApiGatewayContract,
    CustomType,
} from '@cashmere-monorepo/shared-contract-core';
import { Type } from '@sinclair/typebox';

/**
 * Typebox schema for the transactions list delete response
 */
const transactionsListDeleteResponseBodyType = Type.Object({
    message: Type.String(),
});

/**
 * Typebox schema for the transactions list delete query params
 */
export const transactionsListDeleteContract = buildSstApiGatewayContract({
    id: 'transactions-list-delete',
    path: '/transactionsList',
    method: 'DELETE',
    requestContextSchema: CustomType.AuthRequestContext,
    responseSchema: transactionsListDeleteResponseBodyType,
});
