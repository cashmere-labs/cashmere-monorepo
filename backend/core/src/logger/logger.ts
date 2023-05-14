import pino from 'pino';
import {
    LambdaEvent,
    lambdaRequestTracker,
    pinoLambdaDestination,
} from 'pino-lambda';
import { Context, useEvent, useLambdaContext } from 'sst/context';

// Config for our logger
const loggerConfig = {
    level: process.env.API_ENV === 'production' ? 'info' : 'debug',
};

// Setup our global pino logger
export const logger = pino(loggerConfig, pinoLambdaDestination());

/**
 * Bind the pino logger for a specific context
 */
export const useLogger = Context.memo(() => {
    const event = useEvent('api');
    const context = useLambdaContext();
    lambdaRequestTracker()(event as LambdaEvent, context);
});
