import {
    ContractFunctionHandler,
    logger,
    useLogger,
} from '@cashmere-monorepo/backend-core';
import { deleteTransactionsListBySwapId } from '@cashmere-monorepo/backend-service-progress';
import { transactionsListDeleteSwapIdContract } from '@cashmere-monorepo/shared-contract-progress';
import { Hex } from 'viem';

const contractHandler = ContractFunctionHandler(
    transactionsListDeleteSwapIdContract
);

export const handler = contractHandler(async (event) => {
    useLogger();
    logger.debug({ event }, 'Received event');
    const account = event.requestContext.authorizer.lambda.sub;
    const swapId = event.pathParameters.swapId as Hex;
    const response = await deleteTransactionsListBySwapId({
        account,
        swapId,
    });
    logger.debug({ response }, 'Computed response');
    return {
        statusCode: 200,
        body: response,
    };
});
