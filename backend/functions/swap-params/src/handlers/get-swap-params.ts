import {
    ContractFunctionHandler,
    logger,
    useLogger,
} from '@cashmere-monorepo/backend-core';
import { getSwapParams } from '@cashmere-monorepo/backend-service-swap';
import { swapParamsContract } from '@cashmere-monorepo/shared-contract-swap-params';

// Build our contract handler for the estimate swap contract
const contractHandler = ContractFunctionHandler(swapParamsContract);

// Export our handler
export const handler = contractHandler(async (event) => {
    useLogger();
    logger.debug({ event }, 'Received event');
    const response = await getSwapParams({
        srcChainId: parseInt(event.queryStringParameters.srcChainId),
        dstChainId: parseInt(event.queryStringParameters.dstChainId),
        amount: BigInt(event.queryStringParameters.amount),
        srcToken: event.queryStringParameters.srcToken,
        dstToken: event.queryStringParameters.dstToken,
        receiver: event.queryStringParameters.receiver,
    });
    logger.debug({ response }, 'Computed response');
    return {
        statusCode: 200,
        body: response,
    };
});
