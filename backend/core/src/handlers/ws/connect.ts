import { wsConnection } from '@cashmere-monorepo/backend-service-websocket';
import { ApiHandler } from 'sst/node/api';
import { useLogger } from '../../logger/logger';

/**
 * Handler for web socket connect event.
 */
export const handler = ApiHandler(async (event, context) => {
    useLogger();
    // TODO: Extract connection ID from event
    await wsConnection('TODO');
});
