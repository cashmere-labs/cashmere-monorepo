import { logger, useLogger } from '@cashmere-monorepo/backend-core';
import { scanEveryBlockchain } from '@cashmere-monorepo/backend-service-worker/src';

/**
 * The handler for our bridge cron. Run every minutes accross all the chains
 * @param event
 */
export const handler = async () => {
    useLogger();
    logger.info('New bridge event handler');

    // Run the scanner on each chain
    await scanEveryBlockchain();
};

// TODO: For better parallelism, event queue per chain?
//  Like scheduled event bridges? Like that we got messaging + scheduling per chain?
