import {
    CrossChainSwapInitiatedLogType,
    NATIVE_PLACEHOLDER,
    SwapDataTokenMetadata,
    SwapMessageReceivedLogType,
    SwapPayload,
    getAggregatorRepository,
    getAssetRepository,
    getAssetRouterRepository,
    getBridgeRepository,
    l0ChainIdToConfigMapViem,
} from '@cashmere-monorepo/backend-blockchain';
import { logger } from '@cashmere-monorepo/backend-core';
import {
    SwapDataDbDto,
    getSwapDataRepository,
} from '@cashmere-monorepo/backend-database';
import { createHash } from 'node:crypto';
import { Address, Hex, formatEther } from 'viem';
import { createBatchedTx } from '../batchedTx';
import { NewBatchedTx } from '../batchedTx/types';
import {
    buildSwapDataDbDto,
    buildSwapDataDbDtoFromLogs,
    placeholderTxId,
} from '../utils';

/**
 * Build our event handler
 * @param chainId
 */
export const buildEventHandler = async (
    chainId: number
): Promise<{
    handleSwapPerformedEvent: (
        log: SwapMessageReceivedLogType
    ) => Promise<void>;
    sendContinueTxForSwapData: (swapData: SwapDataDbDto) => Promise<void>;
    handleSwapInitiatedEvent: (
        log: CrossChainSwapInitiatedLogType
    ) => Promise<SwapDataDbDto | undefined>;
}> => {
    const aggregatorRepository = getAggregatorRepository(chainId);
    const bridgeRepository = getBridgeRepository(chainId);
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
     * Rebuild the swap data from the given swap id
     * @param swapId
     * @param srcChainId layer 0 src chain id
     */
    const rebuildSwapDataFromId = async (
        swapId: Hex,
        srcChainId: number
    ): Promise<SwapDataDbDto> => {
        // Get the swap message received, and decode the event
        const swapMessage = await bridgeRepository.getReceivedSwap(
            swapId,
            srcChainId
        );
        const decodedPayload = SwapPayload.decode(swapMessage.payload);

        // Get the token metadata
        const tokenMetadata = await getTokenDataByPoolIdsForProgress(
            l0ChainIdToConfigMapViem[srcChainId],
            chainId, // Current chain id
            NATIVE_PLACEHOLDER,
            decodedPayload.lwsPoolId,
            decodedPayload.hgsPoolId,
            decodedPayload.dstToken
        );

        // Build our swap data object and return it
        return buildSwapDataDbDto(
            decodedPayload,
            {
                id: swapMessage.id,
                amount: swapMessage.amount,
                fee: swapMessage.fee,
                srcChainId: l0ChainIdToConfigMapViem[srcChainId],
                dstChainId: chainId,
                initiatedTxHash: placeholderTxId,
                performedTxHash: placeholderTxId,
            },
            tokenMetadata,
            // TODO: Is amount message the right thing's for src amount?
            // TODO: args.amount is used in hgs amount on the event created swap data
            // TODO: And the start amount value is the one present in the initial tx
            swapMessage.amount,
            true
        );
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
    ): Promise<SwapDataDbDto | undefined> => {
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
        const swapData = buildSwapDataDbDtoFromLogs(
            chainId,
            payload,
            log,
            swapTokenMetadata,
            srcAmount,
            skipProcessing
        );

        // TODO: The add swap data was also increasing stat's
        // TODO: Handle duplicates
        // Save the swap data in our database and return the fresh data
        return await swapDataRepository.save(swapData);
    };

    /**
     * Handle a swap performed event
     * @param log
     */
    const handleSwapPerformedEvent = async (
        log: SwapMessageReceivedLogType
    ): Promise<void> => {
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
        const swapSrcChainId = log.args._message?.srcChainId;
        if (!swapId || !swapSrcChainId) {
            throw new Error(
                `No swap id founded for continuation in the log tx:${log.transactionHash} index:${log.logIndex}`
            );
        }
        let swapData = await swapDataRepository.get(swapId);
        if (!swapData) {
            logger.info(
                {
                    chainId,
                    swapId,
                    log,
                },
                "The swap data wasn't found locally, rebuilding it from blockchain"
            );
            // Try to rebuild the swap data from local data
            let newSwapData: SwapDataDbDto | undefined =
                await rebuildSwapDataFromId(swapId, swapSrcChainId);
            logger.debug(
                { chainId, swapId, newSwapData },
                'Rebuilt the swap data from on-chain data'
            );
            // Save it in db
            newSwapData = await swapDataRepository.save(newSwapData);
            // If it was a fail, throw an error
            if (!newSwapData)
                throw new Error(`The swap ${swapId} isn't known, aborting`);
            // Otherwise, replace the previous undefined one
            swapData = newSwapData;
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
        await swapDataRepository.update(swapData, ['status.swapPerformedTxid']);

        // Send the continuation tx
        await sendContinueTxForSwapData(swapData);
    };

    return {
        handleSwapInitiatedEvent,
        handleSwapPerformedEvent,
        sendContinueTxForSwapData,
    };
};
