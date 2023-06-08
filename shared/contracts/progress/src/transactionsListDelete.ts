// transactionsListDelete.ts
import {
    buildSstApiGatewayContract,
    CustomType,
} from '@cashmere-monorepo/shared-contract-core';
import { Type } from '@sinclair/typebox';

// Typebox schema for the response body
export const transactionsListDeleteResponseBodyType = Type.Object({
    message: Type.String(),
});

// SST API Gateway contract
export const transactionsListDeleteContract = buildSstApiGatewayContract({
    id: 'transactions-list-delete',
    path: '/api/transactionsList',
    method: 'DELETE',
    requestContextSchema: CustomType.AuthRequestContext,
    responseSchema: transactionsListDeleteResponseBodyType,
});
