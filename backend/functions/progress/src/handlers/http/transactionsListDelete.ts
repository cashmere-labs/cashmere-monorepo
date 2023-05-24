// transactionsListDelete.ts
import {
    ContractFunctionHandler,
    logger,
    useLogger,
} from '@cashmere-monorepo/backend-core';
import { deleteTransactionsList } from '@cashmere-monorepo/backend-service-progress';
import { transactionsListDeleteContract } from '@cashmere-monorepo/shared-contract-progress';

// Build our contract handler for the progress contract
const contractHandler = ContractFunctionHandler(transactionsListDeleteContract);

// Export our handler
export const handler = contractHandler(async (event) => {
    useLogger();
    logger.debug({ event }, 'Received event');
    const account = event.requestContext.authorizer.lambda.sub;
    const response = await deleteTransactionsList({
        account: account,
    });
    logger.debug({ response }, 'Computed response');
    return {
        statusCode: 200,
        body: response,
    };
});
