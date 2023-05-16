import { wsConnection } from '@cashmere-monorepo/backend-service-websocket';
import { ApiHandler } from 'sst/node/api';
import { useLogger } from '../../logger/logger';
import { castProxyEventToWebSocketEvent } from '../../types';

/**
 * Handler for web socket connect event.
 * TODO: Api handler for now, waiting for this PR to be merged: https://github.com/serverless-stack/sst/pull/2817
 */
export const handler = ApiHandler(async (event, context) => {
    useLogger();
    // Ensure we got the connection id in the event content
    const mappedEvent = castProxyEventToWebSocketEvent(event);
    // Handle the connection
    await wsConnection(mappedEvent.requestContext.connectionId);
});
