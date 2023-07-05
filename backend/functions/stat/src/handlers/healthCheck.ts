import {
    ContractFunctionHandler,
    logger,
    useLogger,
} from '@cashmere-monorepo/backend-core';
import { healthCheckContract } from '@cashmere-monorepo/shared-contract-stat';
import { HandlerType } from './types';

// Build our contract handler for the test contract
const contractHandler = ContractFunctionHandler(healthCheckContract);

// Export our handler
export const handler: HandlerType = contractHandler(async (event) => {
    useLogger();

    logger.debug('Computed response');
    return {
        statusCode: 200,
        body: {
            status: 'OK',
            message: 'The stat api is operating normally.',
            timestamp: new Date().toISOString(),
        },
    };
});
