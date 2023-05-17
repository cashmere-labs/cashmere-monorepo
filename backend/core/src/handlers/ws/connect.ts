import { wsConnection } from '@cashmere-monorepo/backend-service-websocket';
import { WebSocketApiHandler } from 'sst/node/websocket-api';
import { useLogger } from '../../logger/logger';

/**
 * Handler for web socket connect event.
 */
export const handler = WebSocketApiHandler(async (event) => {
    useLogger();
    // Handle the connection
    await wsConnection(event.requestContext.connectionId);
    // Tell the connection was a success
    return 'connected';
});
