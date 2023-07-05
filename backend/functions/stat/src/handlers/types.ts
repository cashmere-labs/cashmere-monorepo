import { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

export type HandlerType = (
    event: import('aws-lambda').APIGatewayProxyEventV2,
    context: import('aws-lambda').Context
) => Promise<APIGatewayProxyStructuredResultV2>;
