import {
    CrossChainSwapInitiatedLogType,
    getAggregatorRepository,
    getAssetRepository,
    getAssetRouterRepository,
    l0ChainIdToConfigMapViem,
    SwapPayload,
} from '@cashmere-monorepo/backend-blockchain';
import { SwapDataTokenMetadata } from '@cashmere-monorepo/backend-blockchain/src/repositories/progress.repository';
import { logger } from '@cashmere-monorepo/backend-core';
import { getSwapDataRepository } from '@cashmere-monorepo/backend-database';
import { Address } from 'viem';
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
        log: CrossChainSwapInitiatedLogType
    ) => {
        // TODO: We basically just send the tx right here
    };

    return {
        handleSwapInitiatedEvent,
    };
};
