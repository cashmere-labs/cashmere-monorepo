import { logger } from '@cashmere-monorepo/backend-core';
import { middyWithLog } from '@cashmere-monorepo/backend-core/middleware/loggerMiddleware';
import { typeboxValidatorMiddleware } from '@cashmere-monorepo/backend-core/middleware/typeboxValidator';
import { swapEstimation } from '@cashmere-monorepo/backend-service-swap';
import {
    EstimateSwapEvent,
    estimateSwapEventType,
    estimateSwapResponse,
} from '@cashmere-monorepo/shared-contract-swap-params';
import httpErrorHandler from '@middy/http-error-handler';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpResponseSerializer from '@middy/http-response-serializer';

const baseHandler = async (event: EstimateSwapEvent) => {
    logger.debug({ event }, 'Received event');
    // @ts-ignore
    const response = await swapEstimation(event.queryStringParameters);
    return {
        statusCode: 200,
        body: response,
    };
};

export const handler = middyWithLog(baseHandler)
    .use(httpEventNormalizer())
    .use(
        httpResponseSerializer({
            serializers: [
                {
                    regex: /^application\/json$/,
                    serializer: ({ body }) => JSON.stringify(body),
                },
            ],
            defaultContentType: 'application/json',
        })
    )
    .use(
        typeboxValidatorMiddleware({
            requestEventSchema: estimateSwapEventType,
            responseEventSchema: estimateSwapResponse,
        })
    )
    .use(httpErrorHandler());
