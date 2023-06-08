import {
    CrossChainSwapInitiatedLogType,
    getAggregatorRepository,
    getAssetRepository,
    getAssetRouterRepository,
    l0ChainIdToConfigMapViem,
    SwapMessageReceivedLogType,
    SwapPayload,
} from '@cashmere-monorepo/backend-blockchain';
import { SwapDataTokenMetadata } from '@cashmere-monorepo/backend-blockchain/src/repositories/progress.repository';
import { logger } from '@cashmere-monorepo/backend-core';
import {
    getSwapDataRepository,
    SwapDataDbDto,
} from '@cashmere-monorepo/backend-database';
import { createHash } from 'node:crypto';
import { Address, formatEther } from 'viem';
import { createBatchedTx } from '../batchedTx';
import { NewBatchedTx } from '../batchedTx/types';
import { buildSwapDataDbDto } from '../utils';

/**
 * Build our event handler
 * @param chainId
 */
export const buildEventHandler = async (chainId: number) => {
    const aggregatorRepository = getAggregatorRepository(chainId);
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
     * Build the continue tx for the given swap data
     * @param swapData
     */
    const sendContinueTxForSwapData = async (swapData: SwapDataDbDto) => {
        // Build our function call data
        const txData = aggregatorRepository.encodeContinueSwapCallData({
            srcChainId: swapData.chains.srcL0ChainId,
            id: swapData.swapId,
        });

        // Build the security hash
        const securityHash = createHash('sha256')
            .update(`continueSwap-${swapData.swapId}`, 'utf8')
            .digest('hex');

        // Yhe priority of this tx is the minimum between the amount of token & 1
        const rawSrcAmount = BigInt(swapData.progress.srcAmount ?? '0');
        const srcAmount = Math.round(parseFloat(formatEther(rawSrcAmount)));
        const priority = Math.max(srcAmount, 1);

        // Create our completed tx object
        const tx: NewBatchedTx = {
            ...txData,
            chainId,
            securityHash,
            priority,
        };

        // And send it to the queue
        await createBatchedTx(tx);
        // TODO: Should have a sort of tx info in each batched tx to handle specific callback's after sent
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
     * Handle a swap performed event
     * @param log
     */
    const handleSwapPerformedEvent = async (
        log: SwapMessageReceivedLogType
    ) => {
        // Ensure our log contain the right data
        if (!log.transactionHash) {
            logger.info(
                { chainId, log },
                "The log doesn't contain a tx hash yet, aborting his processing"
            );
            return;
        }
        // Try to retrieve the swap data for the given log
        const swapId = log.args._message?.id;
        if (!swapId) {
            throw new Error(
                `No swap id founded for continuation in the log tx:${log.transactionHash} index:${log.logIndex}`
            );
        }
        const swapData = await swapDataRepository.getSwapData(swapId);
        if (!swapData) {
            // TODO: For now only handle the one existing, otherwise we should try to rebuild it
            throw new Error(`The swap ${swapId} isn't known, aborting`);
        }

        // If we don't want to process it, skip it
        if (swapData.skipProcessing) {
            logger.info(
                { chainId, swapData, log },
                'The swap data is flagged for processing skip, aborting'
            );
            return;
        }

        // If the swap was already continued, aborting it
        if (swapData.status.swapContinueTxid) {
            logger.warn(
                { chainId, swapData, log },
                'The swap data was already continued, aborting the process'
            );
            return;
        }

        // Update the swap performed tx hash on our swap data
        swapData.status.swapPerformedTxid = log.transactionHash;
        await swapDataRepository.updateSwapData(swapData, [
            'status.swapPerformedTxid',
        ]);

        // Send the continuation tx
        await sendContinueTxForSwapData(swapData);
    };

    return {
        handleSwapInitiatedEvent,
        handleSwapPerformedEvent,
        sendContinueTxForSwapData,
    };
};
