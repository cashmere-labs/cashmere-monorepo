import {
    ContractFunctionHandler,
    logger,
    useLogger,
} from '@cashmere-monorepo/backend-core';
import { login } from '@cashmere-monorepo/backend-service-auth';
import { loginContract } from '@cashmere-monorepo/shared-contract-auth';

// Build our contract handler for the login contract
const contractHandler = ContractFunctionHandler(loginContract);

// Export our handler
export const handler = contractHandler(async (event) => {
    useLogger();

    logger.debug({ event }, 'Received event');
    const response = await login(event.body.siweMessage, event.body.signature);
    logger.debug({ response }, 'Computed response');
    return {
        statusCode: 200,
        body: response,
    };
});
