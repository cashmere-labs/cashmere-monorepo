import {
    ContractFunctionHandler,
    logger,
    useLogger,
} from '@cashmere-monorepo/backend-core';
import { refresh } from '@cashmere-monorepo/backend-service-auth';
import { refreshContract } from '@cashmere-monorepo/shared-contract-auth';

// Build our contract handler for the token refresh contract
const contractHandler = ContractFunctionHandler(refreshContract);

// Export our handler
export const handler = contractHandler(async (event) => {
    useLogger();

    logger.debug({ event }, 'Received event');
    const response = await refresh(event.headers.authorization);
    logger.debug({ response }, 'Computed response');
    return {
        statusCode: 200,
        body: response,
    };
});
