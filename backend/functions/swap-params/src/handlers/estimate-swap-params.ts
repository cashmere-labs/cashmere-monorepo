import {
    ContractFunctionHandler,
    logger,
} from '@cashmere-monorepo/backend-core';
import { swapEstimation } from '@cashmere-monorepo/backend-service-swap';
import { estimateSwapContract } from '@cashmere-monorepo/shared-contract-swap-params';

// Build our contract handler for the estimate swap contract
const contractHandler = ContractFunctionHandler(estimateSwapContract);

// Export our handler
export const handler = contractHandler(async (event) => {
    logger.debug({ event }, 'Received event');
    // @ts-ignore
    const response = await swapEstimation(event.queryStringParameters);
    return {
        statusCode: 200,
        body: response,
    };
});
