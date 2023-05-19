import { useLogger } from '@cashmere-monorepo/backend-core/hooks';
import { wsConnection } from '@cashmere-monorepo/backend-service-websocket';
import { useConnectionId, WebSocketApiHandler } from 'sst/node/websocket-api';

/**
 * Handler for web socket connect event.
 */
export const handler = WebSocketApiHandler(async () => {
    useLogger();
    // Handle the connection
    await wsConnection(useConnectionId());
    // Tell the connection was a success
    return 'connected';
});
