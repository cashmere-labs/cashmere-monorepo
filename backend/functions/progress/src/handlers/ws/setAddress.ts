import { useLogger } from '@cashmere-monorepo/backend-core/logger/logger';
import { ApiHandler } from 'sst/node/api';

/**
 * Handler for web socket setAddress event.
 */
export const handler = ApiHandler(async (event, context) => {
    useLogger();
});
