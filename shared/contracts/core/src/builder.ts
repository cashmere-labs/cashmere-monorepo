import { TSchema, Type } from '@sinclair/typebox';
import { ApiGatewayContract } from './types';
import {
    getReadonlyTypeSchemaIfDefined,
    getTypeSchemaIfDefined,
} from './utils';

// Help us to build type schema
export const buildSstApiGatewayContract = <
    QueryStringInputProperties extends TSchema,
    PathInputProperties extends TSchema,
    BodyInputProperties extends TSchema,
    HeadersSchemaProperties extends TSchema,
    RequestContextProperties extends TSchema,
    ResponseSchema extends TSchema,
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
> => ({
    // Access id, path and method from props
    id: props.id,
    path: props.path,
    method: props.method,

    // Function used to get the output schema for the contract
    getInputSchema: () =>
        Type.Readonly(
            Type.Object({
                queryStringParameters: getReadonlyTypeSchemaIfDefined(
                    props.queryStringParamsSchema
                ),
                pathParameters: getReadonlyTypeSchemaIfDefined(
                    props.pathParamsSchema
                ),
                body: getReadonlyTypeSchemaIfDefined(props.bodySchema),
                headers: getReadonlyTypeSchemaIfDefined(props.headersSchema),
                requestContext: getReadonlyTypeSchemaIfDefined(
                    props.requestContextSchema
                ),
            })
        ),

    // Function used to get the output schema for the contract
    getOutputSchema: () =>
        Type.Object({
            statusCode: Type.Number(),
            body: getTypeSchemaIfDefined(props.responseSchema),
        }),
});
