import pino from 'pino';
import { pinoLambdaDestination } from 'pino-lambda';

// Config for our logger
const loggerConfig = {
  level: process.env.API_ENV === 'dev' ? 'debug' : 'warn',
};

// Setup our global pino logger
const destination = pinoLambdaDestination();
export const logger = pino(loggerConfig, destination);
