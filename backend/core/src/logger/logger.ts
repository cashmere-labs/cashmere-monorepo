import pino from 'pino';
import {
    LambdaContext,
    LambdaEvent,
    lambdaRequestTracker,
    pinoLambdaDestination,
} from 'pino-lambda';
import { Context, useEvent, useLambdaContext } from 'sst/context';

// Config for our logger
const loggerConfig = {
    level: process.env.API_ENV === 'production' ? 'info' : 'debug',
};

// Destination for our pino logger
const destination = pinoLambdaDestination();

// Setup our global pino logger
export const logger = pino(loggerConfig, destination);

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
