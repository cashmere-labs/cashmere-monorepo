import middy from '@middy/core';
import { TObject, TProperties } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

/**
 * Middleware that check the request and response types via typebox
 */
export const typeboxValidatorMiddleware = <
    Input extends TProperties,
    Output extends TProperties
>(types: {
    requestEventSchema: TObject<Input>;
    responseEventSchema: TObject<Output>;
}): middy.MiddlewareObj<APIGatewayProxyEvent, APIGatewayProxyResult> => {
    const before: middy.MiddlewareFn<
        APIGatewayProxyEvent,
        APIGatewayProxyResult
    > = async (request): Promise<void> => {
        // Ensure the request match the input
        if (!Value.Check(types.requestEventSchema, request.event)) {
            // Get the error's
            const errors = [
                ...Value.Errors(types.requestEventSchema, request.event),
            ];
            // Throw an error
            // TODO: Custom error with status code: 422
            throw new Error(
                `Invalid request: ${errors
                    .map((error) => error.message)
                    .join(', ')}`
            );
        }
    };

    const after: middy.MiddlewareFn<
        APIGatewayProxyEvent,
        APIGatewayProxyResult
    > = async (request): Promise<void> => {
        // Ensure the response match the output
        if (!Value.Check(types.responseEventSchema, request.response)) {
            // Get the error's
            const errors = [
                ...Value.Errors(types.responseEventSchema, request.response),
            ];
            // Throw an error
            // TODO: Custom error, status code 500
            throw new Error(
                `Invalid response: ${errors
                    .map((error) => error.message)
                    .join(', ')}`
            );
        }
    };

    return {
        before,
        after,
    };
};
