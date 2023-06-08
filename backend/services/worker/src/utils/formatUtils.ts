import {
    CrossChainSwapInitiatedLogType,
    l0ChainIdToConfigMapViem,
    networkConfigs,
    SwapPayload,
} from '@cashmere-monorepo/backend-blockchain';
import { SwapDataTokenMetadata } from '@cashmere-monorepo/backend-blockchain/src/repositories/progress.repository';
import { SwapDataDbDto } from '@cashmere-monorepo/backend-database';

/**
 * Build the swap data db dto
 */
export const buildSwapDataDbDto = (
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
    return {
        swapId: args.id,
        // Info about our chains
        chains: {
            srcChainId,
            dstChainId: l0ChainIdToConfigMapViem[args?.dstChainId],
            srcL0ChainId: networkConfigs[srcChainId].l0ChainId,
            dstL0ChainId: args?.dstChainId,
        },
        // Info about the paths
        path: {
            lwsPoolId: payload.lwsPoolId,
            hgsPoolId: payload.hgsPoolId,
            hgsAmount: args.amount.toString(),
            dstToken: payload.dstToken,
            minHgsAmount: payload.minHgsAmount.toString(),
            fee: args.fee.toString(),
        },
        // Info about the receiver
        user: {
            receiver: payload.receiver,
            signature: payload.signature,
        },
        // Info about the status
        status: {
            swapInitiatedTimestamp: Date.now(),
            swapInitiatedTxid: log.transactionHash ?? undefined,
            l0Link: `tx/${log.transactionHash}`,
        },
        // Info about the progress
        progress: tokenMetadata,
        // Do we skip the processing ?
        skipProcessing,
    };
};
