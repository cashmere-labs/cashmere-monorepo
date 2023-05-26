import {
    getAssetRouterRepository,
    getBridgeRepository,
    SwapInitiatedLogType,
} from '@cashmere-monorepo/backend-blockchain';
import { getBlockchainRepository } from '@cashmere-monorepo/backend-blockchain/src/repositories/blockchain.repository';
import { logger } from '@cashmere-monorepo/backend-core';

/**
 * Build the bridge repository for the given chain
 * @param chainId
 */
export const buildBridgeBlockScanner = async (chainId: number) => {
    // Fetch some repo we will use every where
    const blockchainRepository = await getBlockchainRepository(chainId);
    const assetRouterRepository = getAssetRouterRepository(chainId);
    const bridgeRepository = getBridgeRepository(chainId);

    /**
     * Handle a new swap initiated event's
     */
    const handleSwapInitiatedEvent = async (log: SwapInitiatedLogType) => {
        logger.debug({ chainId, log }, 'Handling swap initiated event');
    };

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
            // Extract swap data from the event
            /*
            const swapData = await this.handleSwapInitiatedEvent(logOut);
            this.progressService.notifyProgressUpdate(swapData);
            if (swapData) {
                this.logger.log(
                    `Swap id ${logOut.args.id} initiated on block ${logOut.blockNumber}, tx ${logOut.transactionHash} recorded`,
                    {
                        chainId: this.chainId,
                        swapId: logOut.args.id,
                        txid: logOut.transactionHash,
                    }
                );
            } else {
                this.logger.warn(
                    `Did not create swap id ${logOut.args.id} initiated on block ${logOut.blockNumber}, tx ${logOut.transactionHash} (already recorded?)`,
                    {
                        chainId: this.chainId,
                        swapId: logOut.args.id,
                        txid: logOut.transactionHash,
                    }
                );
            }

             */
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

        /*
        TODO: Port this logic part
        // Check all the given swap logs for the given block range
        await this.checkSwapLogsForBlocks(fromBlock, targetBlock);

        // Check all the tx status
        try {
            await this.checkTxStatus();
        } catch (e) {
            this.logger.error('Unable to check all the tx status', e, {
                chainId: this.chainId,
            });
        }*/

        return { lastBlockHandled: maxBlock };
    };

    // Return our process bridge function
    return { checkSwapLogsForBlocks };
};
