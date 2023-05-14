import { logger } from '@cashmere-monorepo/backend-core';
import { buildFunctionHandler } from '@cashmere-monorepo/backend-core/utils';
import { swapEstimation } from '@cashmere-monorepo/backend-service-swap';
import { estimateSwapContract } from '@cashmere-monorepo/shared-contract-swap-params';

export const handler = buildFunctionHandler(estimateSwapContract)(
    async (event) => {
        logger.debug({ event }, 'Received event');
        // @ts-ignore
        const response = await swapEstimation(event.queryStringParameters);
        return {
            statusCode: 200,
            body: response,
        };
    }
);
