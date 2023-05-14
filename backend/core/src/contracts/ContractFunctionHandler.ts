// Build an sst function from an API Gateway contract
import { GenericApiGatewayContract } from '@cashmere-monorepo/shared-contract-core';
import { Static, TSchema } from '@sinclair/typebox';
import { TypeCheck, TypeCompiler } from '@sinclair/typebox/compiler';
import { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { LambdaEvent, lambdaRequestTracker } from 'pino-lambda';
import { ApiHandler } from 'sst/node/api';

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
    console.log('Cold handler setup');
    console.time('cold-handler-setup');
    // Get the input and output schema
    const inputSchema = schema.getInputSchema();
    const outputSchema = schema.getOutputSchema();

    // Build our type compiler (this avoids too much type generation and save runtime perf on multiple lambda call's)
    const eventTypeCompiler = TypeCompiler.Compile(inputSchema);
    const responseTypeCompiler = TypeCompiler.Compile(outputSchema);
    console.timeEnd('cold-handler-setup');

    // Build our api handler
    return (handler: FunctionHandlerType<Contract>) =>
        ApiHandler(async (_event, _context) => {
            console.time('setup');
            console.time('setup-logger');
            // Bind pino to the given context
            lambdaRequestTracker()(_event as LambdaEvent, _context);
            console.timeEnd('setup-logger');
            // Parse the event body and update the event if needed (TODO: Also handle base64 body, like useBody() hooks from SST)
            if (_event.body && typeof _event.body === 'string') {
                // Update the event with the parsed body
                Object.assign(_event, { body: JSON.parse(_event.body) });
            }
            // Validate the input
            console.time('setup-input');
            const input = validateTypeOrThrow(eventTypeCompiler, _event);
            console.timeEnd('setup-input');
            console.timeEnd('setup');

            // Run the handler
            console.time('handler');
            const response = await handler(input);
            console.timeEnd('handler');

            // Validate the output
            const validatedResponse = validateTypeOrThrow(
                responseTypeCompiler,
                response
            );

            // Return the response with a string version of the body (if body present)
            if (validatedResponse.body) {
                return Object.assign(validatedResponse, {
                    body: JSON.stringify(validatedResponse.body),
                });
            }
            // Otherwise, return a response with no body
            return Object.assign(validatedResponse, { body: undefined });
        });
};

// Type for our function handler's
export type FunctionHandlerType<Contract extends GenericApiGatewayContract> = (
    event: Static<ReturnType<Contract['getInputSchema']>>
) => Promise<Static<ReturnType<Contract['getOutputSchema']>>>;

// Validate a type from a type compiler or throw an error
function validateTypeOrThrow<SchemaType extends TSchema, EventType>(
    eventTypeCompiler: TypeCheck<SchemaType>,
    object: EventType
): Static<SchemaType> {
    // Ensure the request match the input
    if (eventTypeCompiler.Check(object)) return object;
    // Otherwise throw an error
    const errors = [...eventTypeCompiler.Errors(object)];
    // Throw an error
    // TODO: Custom error with status code: 422
    throw new Error(
        `Invalid request: ${errors.map((error) => error.message).join(', ')}`
    );
}
