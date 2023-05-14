// Build an api gateway contract
import { TNumber, TObject, TSchema, Type } from '@sinclair/typebox';

export const buildSstApiGatewayContract = <
    QueryStringInputProperties extends TSchema,
    PathInputProperties extends TSchema,
    BodyInputProperties extends TSchema,
    HeadersSchemaProperties extends TSchema,
    RequestContextProperties extends TSchema,
    ResponseSchema extends TSchema
>(props: {
    id: string;
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    queryStringParamsSchema?: QueryStringInputProperties;
    pathParamsSchema?: PathInputProperties;
    bodySchema?: BodyInputProperties;
    headersSchema?: HeadersSchemaProperties;
    requestContextSchema?: RequestContextProperties;
    responseSchema?: ResponseSchema;
}): ApiGatewayContract<
    QueryStringInputProperties,
    PathInputProperties,
    BodyInputProperties,
    HeadersSchemaProperties,
    RequestContextProperties,
    ResponseSchema
> => {
    return {
        // Access id, path and method from props
        id: props.id,
        path: props.path,
        method: props.method,

        // Function used to get the output schema for the contract
        getInputSchema: () =>
            Type.Object(
                {
                    queryStringParameters:
                        props.queryStringParamsSchema ?? Type.Void(),
                    pathParameters: props.pathParamsSchema ?? Type.Void(),
                    body: props.bodySchema ?? Type.Void(),
                    headers: props.headersSchema ?? Type.Unknown(),
                    requestContext:
                        props.requestContextSchema ?? Type.Unknown(),
                },
                { required: true }
            ),

        // Function used to get the output schema for the contract
        getOutputSchema: () =>
            Type.Object(
                {
                    statusCode: Type.Number(),
                    body: props.responseSchema ?? Type.Void(),
                },
                { required: true }
            ),
    };
};

export type ApiGatewayContract<
    QueryStringInputProperties extends TSchema,
    PathInputProperties extends TSchema,
    BodyInputProperties extends TSchema,
    HeadersSchemaProperties extends TSchema,
    RequestContextProperties extends TSchema,
    ResponseSchema extends TSchema
> = {
    id: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    getInputSchema: () => TObject<{
        queryStringParameters: QueryStringInputProperties;
        pathParameters: PathInputProperties;
        body: BodyInputProperties;
        headers: HeadersSchemaProperties;
        requestContext: RequestContextProperties;
    }>;
    getOutputSchema: () => TObject<{
        body: ResponseSchema;
        statusCode: TNumber;
    }>;
};

export type GenericApiGatewayContract = {
    id: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    getInputSchema: () => TObject<{
        queryStringParameters: TSchema;
        pathParameters: TSchema;
        body: TSchema;
        headers: TSchema;
        requestContext: TSchema;
    }>;
    getOutputSchema: () => TObject<{ body: TSchema; statusCode: TNumber }>;
};
