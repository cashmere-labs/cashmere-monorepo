import {
    APIGatewayProxyEventV2,
    APIGatewayProxyWebsocketEventV2,
} from 'aws-lambda';

/**
 * Casts an API Gateway event to a WebSocket event.
 * @param event
 */
export const castProxyEventToWebSocketEvent = (
    event: APIGatewayProxyEventV2
) => {
    // @ts-ignore
    const mappedEvent = event as APIGatewayProxyWebsocketEventV2;
    if (!mappedEvent.requestContext.connectionId) {
        throw new Error(
            'No connection ID found in event, unable to cast it to a WebSocket event'
        );
    }
    return mappedEvent;
};
