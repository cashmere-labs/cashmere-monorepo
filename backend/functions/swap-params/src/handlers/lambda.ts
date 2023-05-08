import { ApiHandler } from 'sst/node/api';
import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import validator from '@middy/validator';
import httpEventNormalizer from '@middy/http-event-normalizer';
import {
    estimateQueryStringParametersSchema,
    estimateResponseSchema,
} from '@cashmere-monorepo/shared-contract-swap-params';
import httpResponseSerializer from '@middy/http-response-serializer';

export const handler = ApiHandler(async (_evt) => {
    return {
        statusCode: 200,
        body: `Hello world from swap estimate functions.`,
    };
});

const baseHandler = () => {};

export const main = middy(baseHandler)
    .use(httpEventNormalizer())
    .use(
        validator({
            eventSchema: estimateQueryStringParametersSchema,
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
