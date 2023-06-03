import {
    getAssetRouterRepository,
    getBridgeRepository,
} from '@cashmere-monorepo/backend-blockchain';
import { getBlockchainRepository } from '@cashmere-monorepo/backend-blockchain/src/repositories/blockchain.repository';
import { logger } from '@cashmere-monorepo/backend-core';
import { buildEventHandler } from './eventHandler';

/**
 * Build the bridge repository for the given chain
 * @param chainId
 */
export const buildBridgeBlockScanner = async (chainId: number) => {
    // Get our event handler
    const eventHandler = await buildEventHandler(chainId);

    // Fetch some repo we will use every where
    const blockchainRepository = getBlockchainRepository(chainId);
    const assetRouterRepository = getAssetRouterRepository(chainId);
    const bridgeRepository = getBridgeRepository(chainId);

    /**
     * Check any swap logs in the given block ranges
     */
    const checkSwapLogsForBlocks = async (blockRange: {
        from: bigint;
        to: bigint;
    }) => {
        logger.debug(
            { chainId, blockRange },
            'Will check for any swap logs on the given block ranges'
        );

        // Get all the swap initiated logs for the given filter
        const swapInitiatedLogs =
            await assetRouterRepository.getSwapInitiatedEvents({
                fromBlock: blockRange.from,
                toBlock: blockRange.to,
            });
        logger.debug(
            { chainId, blockRange },
            `Founded ${swapInitiatedLogs.length} swap initiated logs for the given block ranges`
        );

        // Iterate over each logs
        for (const swapInitiatedLog of swapInitiatedLogs) {
            logger.info(
                { chainId, swapInitiatedLog },
                `Handling swap initiated log`
            );
            // Handle the event
            try {
                const swapData = await eventHandler.handleSwapInitiatedEvent(
                    swapInitiatedLog
                );
                // TODO: Was previously notifying the progress here, find another way
                logger.info({ chainId, swapData }, 'Swap data created');
            } catch (e) {
                logger.error(
                    { chainId, error: e },
                    'Error while handling swap initiated event'
                );
            }
        }

        // Get all the swap performed logs for the given filter
        const swapMessageReceivedEvents =
            await bridgeRepository.getSwapMessageReceivedEvents({
                fromBlock: blockRange.from,
                toBlock: blockRange.to,
            });
        logger.debug(
            { chainId, blockRange },
            `Founded ${swapMessageReceivedEvents.length} swap message received events for the given block ranges`
        );
        // Iterate over each blocks
        for (const swapMessageReceivedEvent of swapMessageReceivedEvents) {
            logger.info(
                { chainId, swapMessageReceivedEvent },
                `Handling swap message received event`
            );
            /*
            TODO: Sending this data to the swap bridge queue, in our case preparing all the data here and only send the tx request?
            TODO: Or we can also have a queue to handle all this event, and another one to perform the tx, maybe a bit overkill but better for scaling
            TODO: If we go with event bridges, we can have a queue to process all the vent's in / out
            await this.swapBridgeQueue.add(
                'workerSwapPerformed',
                {
                    chainId: this.chainId,
                    log: logIn,
                },
                {
                    jobId: `swap-performed-${this.chainId}-${logIn.transactionHash}`,
                    ...swapBridgeJobConfig,
                }
            );
             */
        }
    };

    /**
     * Handle new block's on the given chain
     * @param blockRange The block range to handle
     */
    const handleNewBlock = async (blockRange: {
        from: bigint;
        to: bigint;
    }): Promise<{ lastBlockHandled: bigint }> => {
        logger.debug(
            { chainId, blockRange },
            `Handling new blocks for potential bridge trigger`
        );

        // Get the maxed out scan to block for the given range
        const { maxBlock } =
            blockchainRepository.getMaxedOutScanToBlock(blockRange);
        logger.debug(
            { chainId, maxBlock, blockRange },
            `Maxed out block to scan for potential bridge trigger`
        );

        // Check for any swap logs
        await checkSwapLogsForBlocks({ from: blockRange.from, to: maxBlock });

        // Return the last block handled
        return { lastBlockHandled: maxBlock };
    };

    // Return our process bridge function
    return { handleNewBlock };
};
