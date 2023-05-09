import { logger } from '@cashmere-monorepo/backend-core';
import { middyWithLog } from '@cashmere-monorepo/backend-core/middleware/loggerMiddleware';
import {
    EstimateSwapEvent,
    estimateResponseSchema,
    estimateSwapEvent,
} from '@cashmere-monorepo/shared-contract-swap-params';
import httpErrorHandler from '@middy/http-error-handler';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpResponseSerializer from '@middy/http-response-serializer';
import validator from '@middy/validator';

const baseHandler = async (event: EstimateSwapEvent) => {
    logger.debug({ event }, 'Received event');
    return {
        statusCode: 200,
        body: {
            msg: 'Hello world from middyfied handler',
        },
    };
};

export const handler = middyWithLog(baseHandler)
    .use(httpEventNormalizer())
    .use(
        validator({
            eventSchema: estimateSwapEvent,
            responseSchema: estimateResponseSchema,
        })
    )
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
    .use(httpErrorHandler());
