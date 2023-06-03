import { useLogger } from '@cashmere-monorepo/backend-core/hooks';
import { logger } from '@cashmere-monorepo/backend-core/logger/logger';

/**
 * Handler used to send TX
 */
export const handler = async () => {
    // Setup our logger
    useLogger();
    logger.info('Send TX handler');
};
