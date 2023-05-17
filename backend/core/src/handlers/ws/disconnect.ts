import { wsDisconnection } from '@cashmere-monorepo/backend-service-websocket';
import { WebSocketApiHandler } from 'sst/node/websocket-api';
import { useLogger } from '../../logger/logger';

/**
 * Handler for web socket disconnect event.
 */
export const handler = WebSocketApiHandler(async (event) => {
    useLogger();
    // Handle the connection
    await wsDisconnection(event.requestContext.connectionId);
    // Tell the disconnection was a success
    return 'disconnected';
});
