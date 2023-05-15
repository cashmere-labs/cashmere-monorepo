import {
    ContractFunctionHandler,
    logger,
    useLogger,
} from '@cashmere-monorepo/backend-core';
import { swapEstimation } from '@cashmere-monorepo/backend-service-swap';
import { estimateSwapContract } from '@cashmere-monorepo/shared-contract-swap-params';

// Build our contract handler for the estimate swap contract
const contractHandler = ContractFunctionHandler(estimateSwapContract);

// Export our handler
export const handler = contractHandler(async (event) => {
    useLogger();

    const response = await swapEstimation({
        srcChainId: parseInt(event.queryStringParameters.srcChainId),
        dstChainId: parseInt(event.queryStringParameters.dstChainId),
        amount: BigInt(event.queryStringParameters.amount),
        srcToken: event.queryStringParameters.srcToken,
        dstToken: event.queryStringParameters.dstToken,
    });
    logger.debug({ response }, 'Computed response');
    return {
        statusCode: 200,
        body: response,
    };
});
