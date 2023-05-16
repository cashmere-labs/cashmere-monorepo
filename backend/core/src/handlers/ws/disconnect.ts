import { wsDisconnection } from '@cashmere-monorepo/backend-service-websocket';
import { ApiHandler } from 'sst/node/api';
import { useLogger } from '../../logger/logger';
import { castProxyEventToWebSocketEvent } from '../../types';

/**
 * Handler for web socket disconnect event.
 */
export const handler = ApiHandler(async (event, context) => {
    useLogger();
    // Ensure we got the connection id in the event content
    const mappedEvent = castProxyEventToWebSocketEvent(event);
    // Handle the connection
    await wsDisconnection(mappedEvent.requestContext.connectionId);
});
