// Build an sst function from an API Gateway contract
import {
    ApiGatewayContract,
    GenericApiGatewayContract,
} from '@cashmere-monorepo/shared-contract-core';
import { Static, TObject, TProperties, TSchema } from '@sinclair/typebox';
import { TypeCheck, TypeCompiler } from '@sinclair/typebox/compiler';
import { ApiRouteProps } from 'sst/constructs/Api';
import { FunctionProps } from 'sst/constructs/Function';
import { ApiHandler, useJsonBody } from 'sst/node/api';

// Build an SST Api Gateway route function
export const buildSstApiGatewayRouteFunction = <AuthorizerKeys>(
    handlerPath: string,
    schema: GenericApiGatewayContract,
    additionalFunctionProps?: FunctionProps
): { [key: string]: ApiRouteProps<AuthorizerKeys> } => ({
    [schema.method + ' ' + schema.path]: {
        function: {
            handler: handlerPath,
            ...(additionalFunctionProps ?? []),
        },
    },
});

// Build an SST Api Gateway function handler
export const buildFunctionHandler = <
    // Type for the handler's
    QueryStringInputProperties extends TSchema,
    PathInputProperties extends TObject<TProperties>,
    BodyInputProperties extends TSchema,
    HeadersSchemaProperties extends TSchema,
    RequestContextProperties extends TSchema,
    ResponseSchema extends TSchema,
    // Contract type itself
    Contract extends ApiGatewayContract<
        QueryStringInputProperties,
        PathInputProperties,
        BodyInputProperties,
        HeadersSchemaProperties,
        RequestContextProperties,
        ResponseSchema
    >,
    // Parsed types
    Event = Static<ReturnType<Contract['getInputSchema']>>,
    Response = Static<ReturnType<Contract['getOutputSchema']>>
>(
    schema: Contract
) => {
    // Some initial data computation, for hooks etc
    const inputSchema: TObject<{
        pathParameters: PathInputProperties;
        headers: HeadersSchemaProperties;
        queryStringParameters: QueryStringInputProperties;
        body: BodyInputProperties;
        requestContext: RequestContextProperties;
    }> = schema.getInputSchema();
    const outputSchema = schema.getOutputSchema();

    // Build our type compiler (this avoids too much type generation and save runtime perf on multiple lambda call's)
    const eventTypeCompiler = TypeCompiler.Compile(inputSchema);
    const responseTypeCompiler = TypeCompiler.Compile(outputSchema);

    // Build our api handler
    return async (handler: (event: Event) => Promise<Response>) => {
        ApiHandler(async (_event, _ctw) => {
            // Parse the event body and update the event
            const parsedBody = useJsonBody();
            Object.assign(_event, { body: parsedBody });
            // Validate the input
            const input = validateTypeOrThrow(eventTypeCompiler, _event);

            // Run the handler
            const response = await handler(input as Event);

            // Validate the output and return it
            return validateTypeOrThrow(responseTypeCompiler, response);
        });
    };
};

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
