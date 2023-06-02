import {
    CrossChainSwapInitiatedLogType,
    getAssetRepository,
    getAssetRouterRepository,
    getBridgeRepository,
    l0ChainIdToConfigMapViem,
    SwapPayload,
} from '@cashmere-monorepo/backend-blockchain';
import { getAggregatorRepository } from '@cashmere-monorepo/backend-blockchain/src/repositories/aggregator.repository';
import { getBlockchainRepository } from '@cashmere-monorepo/backend-blockchain/src/repositories/blockchain.repository';
import { SwapDataTokenMetadata } from '@cashmere-monorepo/backend-blockchain/src/repositories/progress.repository';
import { logger } from '@cashmere-monorepo/backend-core';
import { getSwapDataRepository } from '@cashmere-monorepo/backend-database';
import { Address } from 'viem';
import { buildSwapDataDbDto } from '../utils';

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

    // Get our swap data db repository
    const swapDataRepository = await getSwapDataRepository();

    /**
     * Get the token data for the given swap
     */
    const getTokenDataByPoolIdsForProgress = async (
        srcChainId: number,
        dstChainId: number,
        srcToken: Address,
        lwsPoolId: number,
        hgsPoolId: number,
        dstToken: Address
    ): Promise<SwapDataTokenMetadata> => {
        // Get all of our tokens
        const lwsToken = await getAssetRouterRepository(
            srcChainId
        ).getPoolTokenAsset(lwsPoolId);
        const hgsToken = await getAssetRouterRepository(
            dstChainId
        ).getPoolTokenAsset(hgsPoolId);

        // Get our two asset repository
        const srcAssetRepo = getAssetRepository(srcChainId);
        const dstAssetRepo = getAssetRepository(dstChainId);

        return {
            srcDecimals: await srcAssetRepo.tokenDecimal(srcToken),
            srcTokenSymbol: await srcAssetRepo.tokenSymbol(srcToken),
            lwsTokenSymbol: await srcAssetRepo.tokenSymbol(lwsToken),
            hgsTokenSymbol: await dstAssetRepo.tokenSymbol(hgsToken),
            dstTokenSymbol: await dstAssetRepo.tokenSymbol(dstToken),
        };
    };

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

        // Get the token metadata
        const swapTokenMetadata = await getTokenDataByPoolIdsForProgress(
            chainId,
            dstChainId,
            srcToken,
            startSwapTxArgs.lwsPoolId,
            startSwapTxArgs.hgsPoolId,
            payload.dstToken
        );

        // Build the swap data db dto
        const swapData = buildSwapDataDbDto(
            chainId,
            payload,
            log,
            swapTokenMetadata,
            srcAmount,
            skipProcessing
        );

        // TODO: The add swap data was also increasing stat's
        // Save the swap data in our database and return the fresh data
        return await swapDataRepository.save(swapData);
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
            try {
                const swapData = await handleSwapInitiatedEvent(
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
