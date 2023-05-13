import { logger } from '@cashmere-monorepo/backend-core';
import { middyWithLog } from '@cashmere-monorepo/backend-core/middleware/loggerMiddleware';
import { swapEstimation } from '@cashmere-monorepo/backend-service-swap';
import {
    estimateResponseSchema,
    estimateSwapEvent,
} from '@cashmere-monorepo/shared-contract-swap-params';
import httpErrorHandler from '@middy/http-error-handler';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpResponseSerializer from '@middy/http-response-serializer';
import validator from '@middy/validator';
import { transpileSchema } from '@middy/validator/transpile';
import {
    CreateAWSLambdaContextOptions,
    awsLambdaRequestHandler,
} from '@trpc/server/adapters/aws-lambda';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { publicProcedure, router } from './trpc';

// Create your router
const appRouter = router({
    'test-lambda-middy': publicProcedure.query(async (opts) => {
        const { input: event } = opts;

        logger.debug({ event }, 'Received event');
        // @ts-ignore
        const response = await swapEstimation(event.queryStringParameters);
        return {
            statusCode: 200,
            body: response,
        };
    }),
});

// created for each request
const createContext = ({
    event,
    context,
}: CreateAWSLambdaContextOptions<APIGatewayProxyEventV2>) => ({}); // no context
// type Context = trpc.inferAsyncReturnType<typeof createContext>

export const baseHandler = awsLambdaRequestHandler({
    router: appRouter,
    createContext,
});

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
