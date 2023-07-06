import { TNumber, TObject, TReadonly, TSchema } from '@sinclair/typebox';
import { ReadonlyTypeIfPresent, TypeIfPresentOrUnknown } from './utils';

/**
 * Generic type for an Api Gateway Contract
 */
export type ApiGatewayContract<
    QueryStringInputProperties extends TSchema | undefined,
    PathInputProperties extends TSchema | undefined,
    BodyInputProperties extends TSchema | undefined,
    HeadersSchemaProperties extends TSchema | undefined,
    RequestContextProperties extends TSchema | undefined,
    ResponseSchema extends TSchema | undefined,
> = {
    id: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    getInputSchema: () => TReadonly<
        TObject<{
            queryStringParameters: ReadonlyTypeIfPresent<QueryStringInputProperties>;
            pathParameters: ReadonlyTypeIfPresent<PathInputProperties>;
            body: ReadonlyTypeIfPresent<BodyInputProperties>;
            headers: ReadonlyTypeIfPresent<HeadersSchemaProperties>;
            requestContext: ReadonlyTypeIfPresent<RequestContextProperties>;
        }>
    >;
    getOutputSchema: () => TObject<{
        body: TypeIfPresentOrUnknown<ResponseSchema>;
        statusCode: TNumber;
    }>;
};

/**
 * More generic ones, without type safety though
 */
export type GenericApiGatewayContract = ApiGatewayContract<
    TSchema,
    TSchema,
    TSchema,
    TSchema,
    TSchema,
    TSchema
>;
