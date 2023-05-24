import { logger } from '@cashmere-monorepo/backend-core/logger/logger';

/**
 * The handler for our bridge cron. Run every minutes accross all the chains
 * @param event
 */
export const handler = async () => {
    logger.info('New bridge event handler');
    // Ensure we
    // TODO: Ensure we don't have parallel execution of the bridge event's
};

// TODO: For better parallelism, event queue per chain?
