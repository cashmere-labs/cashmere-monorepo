import {
    ContractFunctionHandler,
    logger,
    useLogger,
} from '@cashmere-monorepo/backend-core';
import { getSwapDataRepository } from '@cashmere-monorepo/backend-database';
import { totalSwapContract } from '@cashmere-monorepo/shared-contract-stat-params';

// Build our contract handler for the test contract
const contractHandler = ContractFunctionHandler(totalSwapContract);

// Export our handler
export const handler = contractHandler(async (event) => {
    useLogger();

    logger.debug('Computed response');

    const swapDataRepository = await getSwapDataRepository();

    const { count: total } = await swapDataRepository.getAll();

    // Return our response
    return {
        statusCode: 200,
        body: {
            status: 'OK',
            total,
        },
    };
});
