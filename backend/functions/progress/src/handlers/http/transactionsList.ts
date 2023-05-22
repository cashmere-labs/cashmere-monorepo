import {
    ContractFunctionHandler,
    logger,
    useLogger,
} from '@cashmere-monorepo/backend-core';
import { getTransactionsList } from '@cashmere-monorepo/backend-service-progress';
import { transactionsListContract } from '@cashmere-monorepo/shared-contract-progress';

// Build our contract handler for the progress contract
const contractHandler = ContractFunctionHandler(transactionsListContract);

// Export our handler
export const handler = contractHandler(async (event) => {
    useLogger();
    logger.debug({ event }, 'Received event');
    const response = await getTransactionsList({
        account: event.queryStringParameters.account,
        type: event.queryStringParameters.type,
        page: event.queryStringParameters.page || 0,
    });
    logger.debug({ response }, 'Computed response');
    return {
        statusCode: 200,
        body: response,
    };
});
