import { isRunningInProd, logger } from '@cashmere-monorepo/backend-core';
import { scanEveryBlockchain } from '@cashmere-monorepo/backend-service-worker';
import { Handler } from 'sst/context';

/**
 * The handler for our bridge cron. Run every minutes accross all the chains
 * @param event
 */
export const handler = Handler<'sqs', never, void>('sqs', async () => {
    logger.info('New bridge event handler');

    // Run the scanner on each chain
    if (!isRunningInProd()) {
        logger.info(`Skipping bridge scan when not in prod`);
        return;
    }
    await scanEveryBlockchain();
});

// TODO: For better parallelism, event queue per chain?
//  Like scheduled event bridges? Like that we got messaging + scheduling per chain?
