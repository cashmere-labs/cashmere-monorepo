import pino from 'pino';
import { pinoLambdaDestination } from 'pino-lambda';

// Config for our logger
const loggerConfig = {
    level: process.env.API_ENV === 'production' ? 'info' : 'debug',
};

// Destination for our pino logger
const destination = pinoLambdaDestination();

// Setup our global pino logger
export const logger = pino(loggerConfig, destination);
