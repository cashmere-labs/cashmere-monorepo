import {
    ContractFunctionHandler,
    logger,
    useLogger,
} from '@cashmere-monorepo/backend-core';
import { logout } from '@cashmere-monorepo/backend-service-auth';
import { logoutContract } from '@cashmere-monorepo/shared-contract-auth';

// Build our contract handler for the logout contract
const contractHandler = ContractFunctionHandler(logoutContract);

// Export our handler
export const handler = contractHandler(async (event) => {
    useLogger();

    logger.debug({ event }, 'Received event');
    const response = await logout(event.headers.authorization);
    logger.debug({ response }, 'Computed response');
    return {
        statusCode: 201,
        body: {},
    };
});
