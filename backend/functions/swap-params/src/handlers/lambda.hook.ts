import { logger } from '@cashmere-monorepo/backend-core';
import { buildFunctionHandler } from '@cashmere-monorepo/backend-core/utils';
import { swapEstimation } from '@cashmere-monorepo/backend-service-swap';
import {
    estimateSwapContract,
    EstimateSwapEvent,
} from '@cashmere-monorepo/shared-contract-swap-params';

const baseHandler = async (event: EstimateSwapEvent) => {
    logger.debug({ event }, 'Received event');
    // @ts-ignore
    const response = await swapEstimation(event.queryStringParameters);
    return {
        statusCode: 200,
        body: response,
    };
};

// @ts-ignore
export const handler = buildFunctionHandler(estimateSwapContract)(baseHandler);
