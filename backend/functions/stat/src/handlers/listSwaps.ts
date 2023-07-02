import {
    ContractFunctionHandler,
    InvalidArgumentsError,
} from '@cashmere-monorepo/backend-core';
import { getSwapDataRepository } from '@cashmere-monorepo/backend-database';
import { listSwapContract } from '@cashmere-monorepo/shared-contract-stat-params';

// Build our contract handler for the test contract
const contractHandler = ContractFunctionHandler(listSwapContract);

// Export our handler
export const handler = contractHandler(async (event) => {
    if (!event.queryStringParameters.page) {
        throw new InvalidArgumentsError('Missing page number');
    }
    const page = parseInt(event.queryStringParameters.page || '0');

    if (isNaN(page)) {
        throw new InvalidArgumentsError('Page should be a number');
    }
    // Get our swap data repository
    const swapDataRepository = await getSwapDataRepository();

    const { count: total, items: swaps } = await swapDataRepository.getAll({
        page,
    });
    return {
        statusCode: 200,
        body: {
            status: 'OK',
            total,
            swaps,
        },
    };
});
