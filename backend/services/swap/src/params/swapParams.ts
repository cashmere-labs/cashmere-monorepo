import {
    getAssetRouterRepository,
    getBridgeRepository,
    getL0ChainFromChainId,
    getNetworkConfig,
    getProgressRepository,
    getUniswapRepository,
    isPlaceholderToken,
} from '@cashmere-monorepo/backend-blockchain';
import { InvalidArgumentsError, logger } from '@cashmere-monorepo/backend-core';
import { SwapData } from '@cashmere-monorepo/backend-database';
import { DateTime } from 'luxon';
import { Address, getAddress } from 'viem';
import { getAllSwapParamsDatas } from '../helpers/paramsUtils';

// Swap params args
export type SwapParamsArgs = {
    srcChainId: number;
    srcToken: string;
    amount: bigint;
    dstChainId: number;
    dstToken: string;
    receiver: string;
};

export type StartSwapTxArgs = {
    srcToken: string;
    srcAmount: string;
    lwsPoolId: string;
    hgsPoolId: string;
    dstToken: string;
    dstChain: string;
    dstAggregatorAddress: string;
    minHgsAmount: string;
};

// Swap params response
export interface SwapParamsResponse {
    args: StartSwapTxArgs;
    to: Address;
    value: string;
    swapData: SwapData;
}

/**
 * Calculate LWS token amount
 * @param needSrcSwap
 * @param amount
 * @param srcChainId
 * @param srcToken
 * @param lwsToken
 */
export async function getLwsAmount(
    needSrcSwap: boolean,
    amount: bigint,
    srcChainId: number,
    srcToken: Address,
    lwsToken: Address
) {
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
        return tmpDstAmount;
    } else {
        // Otherwise, we can just use the amount
        return amount;
    }
}

/**
 * Calculate HGS token amount
 * @param srcChainId
 * @param dstChainId
 * @param lwsAssetId
 * @param hgsAssetId
 * @param lwsAmount
 */
export async function getHgsAmount(
    srcChainId: number,
    dstChainId: number,
    lwsAssetId: string,
    hgsAssetId: string,
    lwsAmount: bigint
) {
    const { potentialOutcome: hgsAmount } = await getAssetRouterRepository(
        srcChainId
    ).quoteSwaps({
        lwsAssetId: parseInt(lwsAssetId),
        hgsAssetId: parseInt(hgsAssetId),
        dstChainId: getL0ChainFromChainId(dstChainId),
        amount: lwsAmount,
        minAmount: 0n,
    });
    return hgsAmount;
}

/**
 * Calculate the swap tx value
 * @param srcChainId
 * @param dstChainId
 * @param srcTokenOriginal
 * @param amount
 */
export async function getSwapTxValue(
    srcChainId: number,
    dstChainId: number,
    srcTokenOriginal: Address,
    amount: bigint
) {
    // Get the native swap fee
    let value = await getBridgeRepository(srcChainId).getSwapFeeL0(
        getL0ChainFromChainId(dstChainId)
    );
    // If swap is performed from native token, add the amount to the value
    if (isPlaceholderToken(srcTokenOriginal)) {
        value += amount;
    }
    return value;
}

/**
 * Get the swap params
 * @param srcTokenOriginal
 * @param amount
 * @param lwsAssetId
 * @param hgsAssetId
 * @param dstTokenOriginal
 * @param dstChainId
 * @param hgsAmount
 */
export async function buildSwapTxArgs(
    srcTokenOriginal: Address,
    amount: bigint,
    lwsAssetId: string,
    hgsAssetId: string,
    dstTokenOriginal: Address,
    dstChainId: number,
    hgsAmount: bigint
): Promise<StartSwapTxArgs> {
    const dstAggregatorAddress =
        getNetworkConfig(dstChainId).getContractAddress('aggregator');
    const dstChainL0Id = getL0ChainFromChainId(dstChainId);
    return {
        srcToken: srcTokenOriginal,
        srcAmount: amount.toString(),
        lwsPoolId: lwsAssetId,
        hgsPoolId: hgsAssetId,
        dstToken: dstTokenOriginal,
        dstChain: dstChainL0Id.toString(),
        dstAggregatorAddress,
        minHgsAmount: hgsAmount.toString(),
    };
}

/**
 * Build placeholder swap data for frontend progress display
 * @param srcChainId
 * @param dstChainId
 * @param srcTokenOriginal
 * @param srcToken
 * @param lwsToken
 * @param hgsToken
 * @param dstToken
 * @param dstTokenOriginal
 * @param amount
 * @param receiver
 */
export async function buildPlaceholderSwapData(
    srcChainId: number,
    dstChainId: number,
    srcTokenOriginal: Address,
    srcToken: Address,
    lwsToken: Address,
    hgsToken: Address,
    dstToken: Address,
    dstTokenOriginal: Address,
    amount: bigint,
    receiver: Address
): Promise<SwapData> {
    const progressRepository = getProgressRepository();

    return {
        swapId: '0x',
        chains: {
            srcChainId,
            dstChainId,
            srcL0ChainId: 0,
            dstL0ChainId: 0,
        },
        path: {
            lwsPoolId: 0,
            hgsPoolId: 0,
            hgsAmount: '0',
            dstToken,
            minHgsAmount: '0',
            fee: '0',
        },
        user: {
            receiver,
            signature: '0x',
        },
        status: {
            swapInitiatedTimestamp: DateTime.now().toUnixInteger(),
            swapInitiatedTxid: '0x',
        },
        progress: {
            srcToken,
            srcAmount: amount.toString(),
            ...(await progressRepository.getTokenMetadata({
                srcChainId,
                dstChainId,
                srcToken: srcTokenOriginal,
                lwsToken,
                hgsToken,
                dstToken: dstTokenOriginal,
            })),
        },
    };
}

/**
 * Generate swap params
 * @param params
 * @param params.srcChainId
 * @param params.srcToken
 * @param params.amount
 * @param params.dstChainId
 * @param params.dstToken
 * @param params.receiver
 */
export async function getSwapParams(
    params: SwapParamsArgs
): Promise<SwapParamsResponse> {
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

    if (!amount) throw new InvalidArgumentsError('Amount should be non-zero');
    if (srcChainId === dstChainId)
        throw new InvalidArgumentsError(
            'Same chain swaps are currently not supported'
        );

    try {
        // Get all the swap params
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

        // Get LWS and HGS token amounts
        const lwsAmount = await getLwsAmount(
            needSrcSwap,
            amount,
            srcChainId,
            srcToken,
            lwsToken
        );
        const hgsAmount = await getHgsAmount(
            srcChainId,
            dstChainId,
            lwsAssetId,
            hgsAssetId,
            lwsAmount
        );

        // Get swap tx value
        const value = await getSwapTxValue(
            srcChainId,
            dstChainId,
            srcTokenOriginal,
            amount
        );

        return {
            args: await buildSwapTxArgs(
                srcTokenOriginal,
                amount,
                lwsAssetId,
                hgsAssetId,
                dstTokenOriginal,
                dstChainId,
                hgsAmount
            ),
            to: getNetworkConfig(srcChainId).getContractAddress('aggregator'),
            value: value.toString(),
            swapData: await buildPlaceholderSwapData(
                srcChainId,
                dstChainId,
                srcTokenOriginal,
                srcToken,
                lwsToken,
                hgsToken,
                dstToken,
                dstTokenOriginal,
                amount,
                receiver
            ),
        };
    } catch (e) {
        logger.error(e, 'Swap params error');
        throw new Error('Unable to generate swap params');
    }
}
