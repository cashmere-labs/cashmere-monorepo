import {
    getAssetRouterRepository,
    getBridgeRepository,
} from '@cashmere-monorepo/backend-blockchain';
import { getBlockchainRepository } from '@cashmere-monorepo/backend-blockchain/src/repositories/blockchain.repository';
import { logger } from '@cashmere-monorepo/backend-core';
import { getLastBlockRepository } from '@cashmere-monorepo/backend-database/src/repositories/lastBlock.repository';

/**
 * Build the bridge repository for the given chain
 * @param chainId
 */
export const buildBridgeService = async (chainId: number) => {
    // Fetch some repo we will use every where
    const lastBlockRepository = await getLastBlockRepository();
    const blockchainRepository = await getBlockchainRepository(chainId);
    const assetRouterRepository = getAssetRouterRepository(chainId);
    const bridgeRepository = getBridgeRepository(chainId);

    /**
     * Chack any swap logs in the given block ranges
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

    /**
     * Process our bridge event's on the given chain
     */
    const processBridgeOnChain = async () => {
        // TODO: Execution mutex for this chain with dynamo db

        // Get the latest block explored for the given chain
        const lastBlockIterated = await lastBlockRepository.getForChainAndType(
            chainId,
            'bridge'
        );

        // Get the latest blockchain block
        const targetBlock = await blockchainRepository.getLastBlock();

        // If we don't have a last block iterated, we start from the last block
        if (!lastBlockIterated) {
            logger.info(
                { chainId, targetBlock },
                `No last block iterated, starting from the last block`
            );
            await lastBlockRepository.updateForChainAndType(
                chainId,
                'bridge',
                Number(targetBlock)
            );
            return;
        }

        // Our start block for the handling
        let startBlock = BigInt(lastBlockIterated);

        // While we have blocks to handle
        while (startBlock < targetBlock) {
            // Wait to handle all the new blocks on this chain
            const blockHandlingResult = await handleNewBlock({
                from: startBlock,
                to: targetBlock,
            });
            logger.debug(
                { chainId, startBlock, targetBlock, blockHandlingResult },
                `Finished to handle new block's for potential bridge trigger`
            );
            // Once we have handled all the blocks, we can update the last block iterated
            await lastBlockRepository.updateForChainAndType(
                chainId,
                'bridge',
                Number(blockHandlingResult.lastBlockHandled)
            );
            // Update the start block
            startBlock = blockHandlingResult.lastBlockHandled;
            // Wait for 500ms before the next trigger
            await new Promise((resolve) => setTimeout(resolve, 500));
        }

        logger.info(
            { chainId, lastBlockIterated, targetBlock },
            `Handled all the blocks range for potential bridge event's`
        );
    };

    // Return our process bridge function
    return { processBridgeOnChain };
};
