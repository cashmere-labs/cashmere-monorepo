import { LambdaContext, LambdaEvent, lambdaRequestTracker } from 'pino-lambda';
import { Context, useEvent, useLambdaContext } from 'sst/context';

// Request tracker for pino
const withRequest = lambdaRequestTracker();

/**
 * Bind the pino logger for a specific context
 */
export const useLogger = Context.memo(() => {
    const event = useEvent('api');
    const context = useLambdaContext();
    withRequest(event as LambdaEvent, context as LambdaContext);
});
