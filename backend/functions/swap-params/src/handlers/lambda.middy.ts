import { logger } from '@cashmere-monorepo/backend-core';
import { middyWithLog } from '@cashmere-monorepo/backend-core/middleware/loggerMiddleware';
import { swapEstimation } from '@cashmere-monorepo/backend-service-swap';
import {
    EstimateSwapEvent,
    estimateResponseSchema,
    estimateSwapEvent,
} from '@cashmere-monorepo/shared-contract-swap-params';
import httpErrorHandler from '@middy/http-error-handler';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpResponseSerializer from '@middy/http-response-serializer';
import validator from '@middy/validator';
import { transpileSchema } from '@middy/validator/transpile';

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
        validator({
            eventSchema: transpileSchema(estimateSwapEvent),
            responseSchema: transpileSchema(estimateResponseSchema),
        })
    )
    .use(httpErrorHandler());
