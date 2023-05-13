import {
    CreateAWSLambdaContextOptions,
    awsLambdaRequestHandler,
} from '@trpc/server/adapters/aws-lambda';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { publicProcedure, router } from './trpc';

// Create the router
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

// Create the handler
export const handler = awsLambdaRequestHandler({
    router: appRouter,
    createContext,
});
