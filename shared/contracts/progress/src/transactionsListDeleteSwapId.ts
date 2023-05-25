import {
    buildSstApiGatewayContract,
    CustomType,
} from '@cashmere-monorepo/shared-contract-core';
import { Type } from '@sinclair/typebox';

// The schema for the request path parameters
export const transactionsListDeleteSwapIdParamsType = Type.Object({
    swapId: CustomType.Hex(),
});

// Typebox schema for the response body
export const transactionsListDeleteSwapIdResponseBodyType = Type.Object({
    message: Type.String(),
});

// SST API Gateway contract
export const transactionsListDeleteSwapIdContract = buildSstApiGatewayContract({
    id: 'transactions-list-delete-swap-id',
    path: '/api/transactionsList/:swapId',
    method: 'DELETE',
    requestContextSchema: CustomType.AuthRequestContext,
    pathParamsSchema: transactionsListDeleteSwapIdParamsType,
    responseSchema: transactionsListDeleteSwapIdResponseBodyType,
});
