import { useLogger } from '@cashmere-monorepo/backend-core/logger/logger';
import { ApiHandler } from 'sst/node/api';

/**
 * Handler for web socket disconnect event.
 */
export const handler = ApiHandler(async (event, context) => {
    useLogger();
});
