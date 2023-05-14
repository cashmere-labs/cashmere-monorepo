// Build an api gateway contract
import {
    TNumber,
    TObject,
    TProperties,
    TSchema,
    Type,
} from '@sinclair/typebox';

export const buildSstApiGatewayContract = <
    QueryStringInputProperties extends TProperties,
    PathInputProperties extends TProperties,
    BodyInputProperties extends TProperties,
    HeadersSchemaProperties extends TProperties,
    RequestContextProperties extends TProperties,
    ResponseSchema extends TProperties
>(props: {
    id: string;
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    queryStringParamsSchema?: TObject<QueryStringInputProperties>;
    pathParamsSchema?: TObject<PathInputProperties>;
    bodySchema?: TObject<BodyInputProperties>;
    headersSchema?: TObject<HeadersSchemaProperties>;
    requestContextSchema?: TObject<RequestContextProperties>;
    responseSchema?: TObject<ResponseSchema>;
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
        pathParameters: PathInputProperties;
        headers: HeadersSchemaProperties;
        queryStringParameters: QueryStringInputProperties;
        body: BodyInputProperties;
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
        pathParameters: TSchema;
        headers: TSchema;
        queryStringParameters: TSchema;
        body: TSchema;
        requestContext: TSchema;
    }>;
    getOutputSchema: () => TObject<{ body: TSchema; statusCode: TNumber }>;
};
