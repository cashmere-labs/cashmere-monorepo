import {
    ContractFunctionHandler,
    logger,
    useLogger,
} from '@cashmere-monorepo/backend-core';
import { getUndetectedTxIds } from '@cashmere-monorepo/backend-service-progress';
import { undetectedTxIdsContract } from '@cashmere-monorepo/shared-contract-progress';

const contractHandler = ContractFunctionHandler(undetectedTxIdsContract);

export const handler = contractHandler(async (event) => {
    useLogger();
    logger.debug({ event }, 'Received event');
    const txIds = event.queryStringParameters.txIds;
    const response = await getUndetectedTxIds({ txIds });
    logger.debug({ response }, 'Computed response');
    return {
        statusCode: 200,
        body: response,
    };
});
