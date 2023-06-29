import { buildSstApiGatewayContract } from '@cashmere-monorepo/shared-contract-core';
import { Type } from '@sinclair/typebox';

/**
 * Typebox schema for the transactions list query params
 */
const transactionsListQueryParamsType = Type.Object({
    account: Type.String(),
    type: Type.Optional(Type.Union([Type.Literal('complete')])),
    page: Type.Optional(Type.Number()),
});

/**
 * Typebox schema for the transactions list response
 */
const SwapDataResponseDtoType = Type.Object({
    swapId: Type.String(),
    chains: Type.Object({
        srcChainId: Type.Number(),
        dstChainId: Type.Number(),
        srcL0ChainId: Type.Number(),
        dstL0ChainId: Type.Number(),
    }),
    path: Type.Object({
        lwsPoolId: Type.Number(),
        hgsPoolId: Type.Number(),
        hgsAmount: Type.String(),
        dstToken: Type.String(),
        minHgsAmount: Type.String(),
        fee: Type.Optional(Type.String()),
    }),
    user: Type.Object({
        receiver: Type.String(),
        signature: Type.String(),
    }),
    status: Type.Object({
        swapInitiatedTimestamp: Type.Optional(Type.Number()),
        swapInitiatedTxid: Type.Optional(Type.String()),
        l0Link: Type.Optional(Type.String()),
        swapPerformedTxid: Type.Optional(Type.String()),
        swapContinueTxid: Type.Optional(Type.String()),
        swapContinueConfirmed: Type.Optional(Type.Boolean()),
        progressHidden: Type.Optional(Type.Boolean()),
    }),
    progress: Type.Object({
        srcAmount: Type.Optional(Type.String()),
        srcToken: Type.Optional(Type.String()),
        srcDecimals: Type.Optional(Type.Number()),
        srcTokenSymbol: Type.Optional(Type.String()),
        lwsTokenSymbol: Type.Optional(Type.String()),
        hgsTokenSymbol: Type.Optional(Type.String()),
        dstTokenSymbol: Type.Optional(Type.String()),
    }),
    skipProcessing: Type.Optional(Type.Boolean()),
});

/**
 * Typebox schema for the transactions list response
 */
const transactionsListResponseBodyType = Type.Object({
    count: Type.Number(),
    items: Type.Array(SwapDataResponseDtoType),
});

/**
 * Contract for the transactions list
 */
export const transactionsListContract = buildSstApiGatewayContract({
    id: 'transactions-list',
    path: '/transactionsList',
    method: 'GET',
    queryStringParamsSchema: transactionsListQueryParamsType,
    responseSchema: transactionsListResponseBodyType,
});
