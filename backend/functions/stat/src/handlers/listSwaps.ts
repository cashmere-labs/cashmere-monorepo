import {
    ContractFunctionHandler,
    logger,
    useLogger,
} from '@cashmere-monorepo/backend-core';
import { getSwapDataRepository } from '@cashmere-monorepo/backend-database';
import { listSwapContract } from '@cashmere-monorepo/shared-contract-stat-params';

// Build our contract handler for the test contract
const contractHandler = ContractFunctionHandler(listSwapContract);

// Export our handler
export const handler = contractHandler(async (event) => {
    useLogger();

    logger.debug('Computed response');

    if (event.queryStringParameters.page) {
        const page = parseInt(event.queryStringParameters.page || '0');
        if (isNaN(page)) {
            return {
                statusCode: 400,
                body: {
                    status: 'KO',
                    error: 'Invalid page number',
                },
            };
        }
        // Get our swap data repository
        const swapDataRepository = await getSwapDataRepository();

        const { count: total, items: swaps } = await swapDataRepository.getAll(
            page
        );
        return {
            statusCode: 200,
            body: {
                status: 'OK',
                total,
                swaps,
            },
        };
    }
    return {
        statusCode: 403,
        body: {
            status: 'KO',
            error: 'Missing page number',
        },
    };
});
