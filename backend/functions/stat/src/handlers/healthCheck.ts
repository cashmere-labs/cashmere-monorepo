import {
    ContractFunctionHandler,
    logger,
    useLogger,
} from '@cashmere-monorepo/backend-core';
import { testContract } from '@cashmere-monorepo/shared-contract-stat-params';

// Build our contract handler for the test contract
const contractHandler = ContractFunctionHandler(testContract);

// Export our handler
export const handler = contractHandler(async (event) => {
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
