import { useLogger } from '@cashmere-monorepo/backend-core/';
import { addProgressListener } from '@cashmere-monorepo/backend-service-progress';
import { useJsonBody } from 'sst/node/api';
import { WebSocketApiHandler } from 'sst/node/websocket-api';

/**
 * Handler for web socket setAddress event.
 */
export const handler = WebSocketApiHandler(async (event) => {
    useLogger();

    // Extract the address from the event body
    const { address } = useJsonBody();

    // If no address found throw an error
    if (!address) throw new Error('address not found in the message body');

    // Enter the web socket room for the given address
    await addProgressListener(event.requestContext.connectionId, address);

    // Tell the address was added with success
    return 'progress listening started';
});
