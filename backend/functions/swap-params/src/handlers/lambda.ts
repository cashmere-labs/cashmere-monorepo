import { middyWithLog } from '@cashmere-monorepo/backend-core';
import { typeboxValidatorMiddleware } from '@cashmere-monorepo/backend-core/middleware/typeboxValidator';
import httpErrorHandler from '@middy/http-error-handler';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpResponseSerializer from '@middy/http-response-serializer';
import { Type } from '@sinclair/typebox';
import {
    CreateAWSLambdaContextOptions,
    awsLambdaRequestHandler,
} from '@trpc/server/adapters/aws-lambda';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { publicProcedure, router } from './trpc';

// Create your router
const appRouter = router({
    'test-lambda': publicProcedure.query(async () => {
        return `Hello world from swap estimate functions.`;
    }),
});

// created for each request
const createContext = ({
    event,
    context,
}: CreateAWSLambdaContextOptions<APIGatewayProxyEventV2>) => ({}); // no context
// type Context = trpc.inferAsyncReturnType<typeof createContext>

// Create the base handler
export const baseHandler = awsLambdaRequestHandler({
    router: appRouter,
    createContext,
});

/* const eventResponse = Type.Object({
    body: Type.Any(),
}); */

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
            requestEventSchema: Type.Object({}), // No input parameters
            responseEventSchema: Type.Object({}),
        })
    )
    .use(httpErrorHandler());
