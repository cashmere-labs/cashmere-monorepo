import {
    getAssetRouterRepository,
    getBridgeRepository,
    getL0ChainFromChainId,
    getNetworkConfig,
    getProgressRepository,
    getUniswapRepository,
    isPlaceholderToken,
} from '@cashmere-monorepo/backend-blockchain';
import { createHttpError, logger } from '@cashmere-monorepo/backend-core';
import { DateTime } from 'luxon';
import { getAddress } from 'viem';
import { getAllSwapParamsDatas } from '../helpers/paramsUtils';

// Swap params args
type SwapParamsArgs = {
    srcChainId: number;
    srcToken: string;
    amount: bigint;
    dstChainId: number;
    dstToken: string;
    receiver: string;
};

// Swap params response
export interface SwapParamsResponse {
    args: {
        srcToken: string;
        srcAmount: string;
        lwsPoolId: string;
        hgsPoolId: string;
        dstToken: string;
        dstChain: string;
        dstAggregatorAddress: string;
        minHgsAmount: string;
    };
    to: string;
    value: string;
    swapData: any; // TODO: Add type
}

// Generate swap params
export async function getSwapParams(params: SwapParamsArgs) {
    logger.debug({ params }, 'Generating swap params');

    // Extract and format our params
    const [
        srcChainId,
        srcTokenOriginal,
        amount,
        dstChainId,
        dstTokenOriginal,
        receiver,
    ] = [
        params.srcChainId,
        getAddress(params.srcToken),
        params.amount,
        params.dstChainId,
        getAddress(params.dstToken),
        getAddress(params.receiver),
    ];

    if (!amount) throw createHttpError('Amount should be non-zero');
    if (srcChainId === dstChainId)
        throw createHttpError('Same chain swaps are currently not supported');

    try {
        // Get all the swap params
        let lwsAmount: bigint;
        const {
            srcToken,
            dstToken,
            lwsToken,
            hgsToken,
            hgsAssetId,
            lwsAssetId,
            needSrcSwap,
        } = await getAllSwapParamsDatas(
            srcChainId,
            srcTokenOriginal,
            dstChainId,
            dstTokenOriginal
        );

        // If we need an src swap
        if (needSrcSwap) {
            // Get the LWS Amount post routing
            const { dstAmount: tmpDstAmount } = await getUniswapRepository(
                srcChainId
            ).getAmountOut({
                amount,
                fromToken: srcToken,
                toToken: lwsToken,
            });
            lwsAmount = tmpDstAmount;
        } else {
            // Otherwise, we can just use the amount
            lwsAmount = amount;
        }

        const { potentialOutcome: hgsAmount } = await getAssetRouterRepository(
            srcChainId
        ).quoteSwaps({
            lwsAssetId: parseInt(lwsAssetId),
            hgsAssetId: parseInt(hgsAssetId),
            dstChainId: getL0ChainFromChainId(dstChainId),
            amount: lwsAmount,
            minAmount: 0n,
        });

        // Get the native swap fee
        let value = await getBridgeRepository(srcChainId).getSwapFeeL0(
            getL0ChainFromChainId(dstChainId)
        );

        // If swap is performed from native token, add the amount to the value
        if (isPlaceholderToken(srcTokenOriginal)) {
            value += amount;
        }

        const progressRepository = getProgressRepository();

        return {
            args: {
                srcToken: srcTokenOriginal,
                srcAmount: amount.toString(),
                lwsPoolId: lwsAssetId,
                hgsPoolId: hgsAssetId,
                dstToken: dstTokenOriginal,
                dstChain: getL0ChainFromChainId(dstChainId).toString(),
                dstAggregatorAddress:
                    getNetworkConfig(dstChainId).getContractAddress(
                        'aggregator'
                    ),
                minHgsAmount: hgsAmount.toString(),
            },
            to: getNetworkConfig(srcChainId).getContractAddress('aggregator'),
            value: value.toString(),
            swapData: {
                swapId: '0x',
                srcChainId,
                dstChainId,
                srcL0ChainId: 0,
                dstL0ChainId: 0,
                lwsPoolId: 0,
                hgsPoolId: 0,
                hgsAmount: '0',
                dstToken,
                minHgsAmount: '0',
                fee: '0',
                receiver,
                signature: '0x',
                swapInitiatedTimestamp: DateTime.now().toUnixInteger(),
                swapInitiatedTxid: '0x',
                srcAmount: amount.toString(),
                srcToken,
                ...(await progressRepository.getTokenMetadata({
                    srcChainId,
                    dstChainId,
                    srcToken: srcTokenOriginal,
                    lwsToken,
                    hgsToken,
                    dstToken: dstTokenOriginal,
                })),
            },
        } as SwapParamsResponse;
    } catch (e) {
        logger.error(e, 'Swap params error');
        throw new Error('Unable to generate swap params');
    }
}
