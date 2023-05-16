import { ApiHandler } from 'sst/node/api';
import { useLogger } from '../../logger/logger';

/**
 * Handler for web socket disconnect event.
 */
export const handler = ApiHandler(async (event, context) => {
    useLogger();
});
