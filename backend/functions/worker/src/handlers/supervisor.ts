import { logger } from '@cashmere-monorepo/backend-core';
import { Handler } from 'sst/context';

export const handler = Handler<'sqs', never, void>('sqs', async () => {
    logger.info('Supervisor handler');
});
