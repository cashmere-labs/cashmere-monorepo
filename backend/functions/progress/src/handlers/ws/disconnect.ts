import { useLogger } from '@cashmere-monorepo/backend-core/hooks';
import { wsDisconnection } from '@cashmere-monorepo/backend-service-websocket';
import { useConnectionId, WebSocketApiHandler } from 'sst/node/websocket-api';

/**
 * Handler for web socket disconnect event.
 */
export const handler = WebSocketApiHandler(async () => {
    useLogger();
    // Handle the connection
    await wsDisconnection(useConnectionId());
    // Tell the disconnection was a success
    return 'disconnected';
});
