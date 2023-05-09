import middy from '@middy/core';
import { Context } from 'aws-lambda';
import { LambdaEvent, lambdaRequestTracker } from 'pino-lambda';

/**
 * Define the type for our handler
 */
export type InputHandler<
    TEvent,
    TResult,
    TContext extends Context = Context
> = (event: TEvent, context: TContext) => Promise<TResult>;

/**
 * Create a middyfied handler that parse our custom error
 * @param handler  Our base handler
 * @returns The fresh handler
 */
export function middyWithLog<
    TEvent = unknown,
    TResult = any,
    TContext extends Context = Context
>(handler: InputHandler<TEvent, TResult, TContext>) {
    return middy(handler).before(async (request) => {
        lambdaRequestTracker()(request.event as LambdaEvent, request.context);
    });
}
