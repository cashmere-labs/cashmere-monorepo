import {
    CrossChainSwapInitiatedLogType,
    getAssetRouterRepository,
    getBridgeRepository,
    l0ChainIdToConfigMapViem,
    SwapPayload,
} from '@cashmere-monorepo/backend-blockchain';
import { getAggregatorRepository } from '@cashmere-monorepo/backend-blockchain/src/repositories/aggregator.repository';
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
    const aggregatorRepository = getAggregatorRepository(chainId);

    /**
     * Handle a new swap initiated event's
     */
    const handleSwapInitiatedEvent = async (
        log: CrossChainSwapInitiatedLogType
    ) => {
        if (!log.args.payload || !log.args.dstChainId) {
            logger.warn(
                { chainId, log },
                'No swap payload, or dstChainId found in the given log'
            );
            return;
        }
        // Parse the payload
        const payload = SwapPayload.decode(log.args.payload);
        logger.debug(
            { chainId, log, payload },
            'Handling swap initiated event'
        );

        // Ensure we got a tx hash on the given log
        if (!log.transactionHash) {
            // TODO: Should queue the process for this swap until we got a tx hash?
            logger.warn(
                { chainId, log, payload },
                'No tx hash founded on the given log, aborting the process'
            );
            return;
        }

        // Get the args used to start this tx
        const txArgs = await aggregatorRepository.getStartSwapArgs(
            log.transactionHash
        );
        const startSwapTxArgs = txArgs.args[0];

        // Boolean to know if we skip the processing of this swap data or not
        let skipProcessing = false;

        // Ensure the aggregator address match
        const dstChainId = l0ChainIdToConfigMapViem[log.args.dstChainId];
        const dstAggregatorRepository = getAggregatorRepository(dstChainId);
        if (
            !dstAggregatorRepository.isContractAddress(
                startSwapTxArgs.dstAggregatorAddress
            )
        ) {
            logger.warn(
                { chainId, log, payload, startSwapTxArgs },
                'Invalid aggregator address, marking it for process skip'
            );
            skipProcessing = true;
        }

        // Extract some data from it
        const srcToken = startSwapTxArgs.srcToken;
        const srcAmount = startSwapTxArgs.srcAmount;

        // TODO: Save the data in the database and return the built db dto
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
            // Handle the event
            const swapData = await handleSwapInitiatedEvent(swapInitiatedLog);
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

        // Return the last block handled
        return { lastBlockHandled: maxBlock };
    };

    // Return our process bridge function
    return { handleNewBlock, checkSwapLogsForBlocks };
};
