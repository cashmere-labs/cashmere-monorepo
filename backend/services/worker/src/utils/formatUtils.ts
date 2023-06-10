import {
    CrossChainSwapInitiatedLogType,
    l0ChainIdToConfigMapViem,
    networkConfigs,
    SwapPayload,
} from '@cashmere-monorepo/backend-blockchain';
import { SwapDataTokenMetadata } from '@cashmere-monorepo/backend-blockchain/src/repositories/progress.repository';
import { SwapDataDbDto } from '@cashmere-monorepo/backend-database';
import { Hex } from 'viem';

/**
 * Build the swap data db dto
 */
export const buildSwapDataDbDtoFromLogs = (
    srcChainId: number,
    payload: SwapPayload,
    log: CrossChainSwapInitiatedLogType,
    tokenMetadata: SwapDataTokenMetadata,
    srcAmount: bigint,
    skipProcessing: boolean
): SwapDataDbDto => {
    // Extract the log arguments
    const args = log.args;

    // Ensure we got all the param in our args
    if (!args?.id || !args?.dstChainId || !args?.amount || !args?.fee) {
        throw new Error(
            `Missing required arguments in the given log: ${JSON.stringify(
                log
            )}`
        );
    }

    // Build the swap data db dto
    return buildSwapDataDbDto(
        payload,
        {
            id: args.id,
            srcChainId,
            dstChainId: args.dstChainId,
            amount: args.amount,
            fee: args.fee,
            initiatedTxHash: log.transactionHash ?? undefined,
        },
        tokenMetadata,
        srcAmount,
        skipProcessing
    );
};

/**
 * Build the swap data db dto
 */
export const buildSwapDataDbDto = (
    payload: SwapPayload,
    params: {
        id: Hex;
        srcChainId: number;
        dstChainId: number;
        amount: bigint;
        fee: bigint;
        initiatedTxHash?: Hex;
        performedTxHash?: Hex;
    },
    tokenMetadata: SwapDataTokenMetadata,
    srcAmount: bigint,
    skipProcessing: boolean
): SwapDataDbDto => {
    // Build the swap data db dto
    return {
        swapId: params.id,
        // Info about our chains
        chains: {
            srcChainId: params.srcChainId,
            dstChainId: l0ChainIdToConfigMapViem[params.dstChainId],
            srcL0ChainId: networkConfigs[params.dstChainId].l0ChainId,
            dstL0ChainId: params.dstChainId,
        },
        // Info about the paths
        path: {
            lwsPoolId: payload.lwsPoolId,
            hgsPoolId: payload.hgsPoolId,
            hgsAmount: params.amount.toString(),
            dstToken: payload.dstToken,
            minHgsAmount: payload.minHgsAmount.toString(),
            fee: params.fee.toString(),
        },
        // Info about the receiver
        user: {
            receiver: payload.receiver,
            signature: payload.signature,
        },
        // Info about the status
        status: {
            swapInitiatedTimestamp: Date.now(),
            swapInitiatedTxid: params?.initiatedTxHash ?? undefined,
            l0Link: params.initiatedTxHash
                ? `tx/${params.initiatedTxHash}`
                : undefined,
            swapPerformedTxid: params.performedTxHash ?? undefined,
        },
        // Info about the progress
        progress: {
            srcAmount: srcAmount.toString(),
            ...tokenMetadata,
        },
        // Do we skip the processing ?
        skipProcessing,
    };
};

// Placeholder tx id
export const placeholderTxId =
    '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
