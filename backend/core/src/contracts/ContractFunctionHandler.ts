// Build an sst function from an API Gateway contract
import { GenericApiGatewayContract } from '@cashmere-monorepo/shared-contract-core';
import { Static } from '@sinclair/typebox';
import { TypeCompiler } from '@sinclair/typebox/compiler';
import { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { ApiHandler } from 'sst/node/api';
import { HttpError, InternalServerError } from '../error';
import { validateTypeOrThrow } from '../hooks';
import { logger } from '../logger/logger';

// Build an SST Api Gateway function handler
export const ContractFunctionHandler = <
    Contract extends GenericApiGatewayContract
>(
    schema: Contract
): ((
    handler: FunctionHandlerType<Contract>
) => (
    event: import('aws-lambda').APIGatewayProxyEventV2,
    context: import('aws-lambda').Context
) => Promise<APIGatewayProxyStructuredResultV2>) => {
    // Get the input and output schema
    const inputSchema = schema.getInputSchema();
    const outputSchema = schema.getOutputSchema();

    // Build our type compiler (this avoids too much type generation and save runtime perf on multiple lambda call's)
    const eventTypeCompiler = TypeCompiler.Compile(inputSchema);
    const responseTypeCompiler = TypeCompiler.Compile(outputSchema);

    // Build our api handler
    return (handler: FunctionHandlerType<Contract>) =>
        ApiHandler(async (_event, _context) => {
            try {
                // Parse the event body and update the event if needed (TODO: Also handle base64 body, like useBody() hooks from SST)
                if (_event.body && typeof _event.body === 'string') {
                    // Update the event with the parsed body
                    Object.assign(_event, { body: JSON.parse(_event.body) });
                }
                // Validate the input
                const input = validateTypeOrThrow(eventTypeCompiler, _event);

                // Run the handler
                const response = await handler(input);

                // Validate the output
                const validatedResponse = validateTypeOrThrow(
                    responseTypeCompiler,
                    response
                );

                // Return the response with a string version of the body (if body present)
                if (validatedResponse.body) {
                    return Object.assign(validatedResponse, {
                        body: JSON.stringify(validatedResponse.body),
                        headers: { 'content-type': 'application/json' },
                    });
                }
                // Otherwise, return a response with no body
                return Object.assign(validatedResponse, { body: undefined });
            } catch (e) {
                let httpError: HttpError =
                    e instanceof HttpError
                        ? e
                        : new InternalServerError('Unknown error', e);
                logger.error(
                    httpError,
                    'An error occurred while handling a request'
                );
                return {
                    statusCode: httpError.statusCode,
                    body: JSON.stringify({
                        errorCode: httpError.errorCode,
                        message: httpError.message,
                        details: httpError.options?.details,
                    }),
                    headers: { 'content-type': 'application/json' },
                };
            }
        });
};

// Type for our function handler's
export type FunctionHandlerType<Contract extends GenericApiGatewayContract> = (
    event: Static<ReturnType<Contract['getInputSchema']>>
) => Promise<Static<ReturnType<Contract['getOutputSchema']>>>;
