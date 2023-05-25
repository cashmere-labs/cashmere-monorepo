import {
    ContractFunctionHandler,
    logger,
    useLogger,
} from '@cashmere-monorepo/backend-core';
import { generateNewNonce } from '@cashmere-monorepo/backend-service-auth';
import { nonceContract } from '@cashmere-monorepo/shared-contract-auth';

// Build our contract handler for the nonce generator contract
const contractHandler = ContractFunctionHandler(nonceContract);

// Export our handler
export const handler = contractHandler(async (event) => {
    useLogger();

    logger.debug({ event }, 'Received event');
    const response = await generateNewNonce(
        event.queryStringParameters.requestId
    );
    logger.debug({ response }, 'Computed response');
    return {
        statusCode: 200,
        body: response,
    };
});
