import middy from '@middy/core';
import { TObject, TProperties } from '@sinclair/typebox';
import { TypeCompiler } from '@sinclair/typebox/compiler';
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
    // Build our type compiler (this avoid too much type generation and save runtime perf on multiple lambda call's)
    const requestTypeCompiler = TypeCompiler.Compile(types.requestEventSchema);
    const responseTypeCompiler = TypeCompiler.Compile(
        types.responseEventSchema
    );

    // Pre lambda call, ensuring validity of the input
    const before: middy.MiddlewareFn<
        APIGatewayProxyEvent,
        APIGatewayProxyResult
    > = async (request): Promise<void> => {
        // Ensure the request match the input
        if (!requestTypeCompiler.Check(request.event)) {
            // Get the error's
            const errors = [...requestTypeCompiler.Errors(request.event)];
            // Throw an error
            // TODO: Custom error with status code: 422
            throw new Error(
                `Invalid request: ${errors
                    .map((error) => error.message)
                    .join(', ')}`
            );
        }
    };

    // Post lambda execution check, ensuring validity of the typing's
    const after: middy.MiddlewareFn<
        APIGatewayProxyEvent,
        APIGatewayProxyResult
    > = async (request): Promise<void> => {
        // Ensure the response match the output
        if (!responseTypeCompiler.Check(request.response)) {
            // Get the error's
            const errors = [...responseTypeCompiler.Errors(request.response)];
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
