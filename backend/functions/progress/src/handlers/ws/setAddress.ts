import { useLogger } from '@cashmere-monorepo/backend-core/logger/logger';
import { WebSocketApiHandler } from 'sst/node/websocket-api';

/**
 * Handler for web socket setAddress event.
 */
export const handler = WebSocketApiHandler(async (event) => {
    useLogger();

    // Tell the address was added with success
    return 'address added';
});
