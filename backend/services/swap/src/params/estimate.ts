import {
    ONE_INCH_SLIPPAGE,
    getAssetRepository,
    getAssetRouterRepository,
    getBridgeRepository,
    getL0ChainFromChainId,
    getNetworkConfig,
    getUniswapRepository,
} from '@cashmere-monorepo/backend-blockchain';
import { logger } from '@cashmere-monorepo/backend-core';
import { formatEther, formatUnits, getAddress } from 'viem';
import { getAllSwapParamsDatas } from '../helpers/paramsUtils';

// The object required for the swap estimation
type EstimationParams = {
    srcChainId: number;
    srcToken: string;
    amount: bigint;
    dstChainId: number;
    dstToken: string;
};

// Perform a swap estimation
export const swapEstimation = async (params: EstimationParams) => {
    logger.debug({ params }, 'Estimating swaps');
    // Extract and format our param's
    const {
        srcChainId,
        srcToken: srcTokenOriginal,
        amount,
        dstChainId,
        dstToken: dstTokenOriginal,
    } = params;

    try {
        // Get all the swap params
        let lwsAmount: bigint,
            dstAmount: bigint,
            minReceivedLws: bigint,
            minReceivedDst: bigint;
        const {
            srcToken,
            dstToken,
            lwsToken,
            hgsToken,
            lwsAssetId,
            hgsAssetId,
            needSrcSwap,
            needDstSwap,
        } = await getAllSwapParamsDatas(
            srcChainId,
            getAddress(srcTokenOriginal),
            dstChainId,
            getAddress(dstTokenOriginal)
        );

        // If we need a src swap
        if (needSrcSwap) {
            // Get the LWS Amount post routing
            const { dstAmount: tmpLwsAmount } = await getUniswapRepository(
                srcChainId
            ).getAmountOut({
                amount,
                fromToken: srcToken,
                toToken: lwsToken,
            });
            lwsAmount = tmpLwsAmount;
            minReceivedLws =
                (lwsAmount * BigInt(100 - ONE_INCH_SLIPPAGE)) / 100n;
        } else {
            // Otherwise, the swap is just the amount
            minReceivedLws = lwsAmount = amount;
        }

        // Perform swap quotation
        const { potentialOutcome, haircut, minPotentialOutcome } =
            await getAssetRouterRepository(srcChainId).quoteSwaps({
                lwsAssetId: parseInt(lwsAssetId),
                hgsAssetId: parseInt(hgsAssetId),
                dstChainId: getL0ChainFromChainId(dstChainId),
                amount: lwsAmount,
                minAmount: minReceivedLws,
            });

        // Get the amount's
        const hgsAmount: bigint = potentialOutcome;
        const minReceivedHgs: bigint = minPotentialOutcome;
        if (needDstSwap) {
            // Get the dst amount and min received dst amount from uniswap
            const amountOutResult = await getUniswapRepository(
                dstChainId
            ).getAmountOut({
                amount: hgsAmount,
                minAmount: minReceivedHgs,
                fromToken: hgsToken,
                toToken: dstToken,
            });
            // Get the dst amount from the first call
            dstAmount = amountOutResult.dstAmount;
            minReceivedDst = amountOutResult.minDstAmount;
        } else {
            dstAmount = hgsAmount;
            minReceivedDst = BigInt(minReceivedHgs);
        }

        logger.debug(
            {
                needSrcSwap,
                needDstSwap,
                lwsAmount: lwsAmount.toString(),
                minReceivedLws,
                hgsAmount: hgsAmount.toString(),
                minReceivedHgs: minReceivedHgs.toString(),
                dstAmount: dstAmount.toString(),
                minReceivedDst,
                lwsToken,
                hgsToken,
                potentialOutcome: potentialOutcome.toString(),
            },
            'Swap estimate result'
        );
        const priceImpact = '0';

        logger.debug(`haircut ${haircut}`);

        // Get the HGS token info
        const dstAssetRepository = getAssetRepository(dstChainId);
        const hgsSymbol = await dstAssetRepository.tokenSymbol(hgsToken);
        const hgsDecimals = await dstAssetRepository.tokenDecimal(hgsToken);
        const haircutDisp = parseFloat(
            formatUnits(haircut, hgsDecimals)
        ).toFixed(4);

        // Get the native fee's
        const nativeFee = await getBridgeRepository(srcChainId).getSwapFeeL0(
            getL0ChainFromChainId(dstChainId)
        );

        // Build some return param's
        const srcNativeSymbol =
            getNetworkConfig(srcChainId).chain.nativeCurrency.symbol;
        const feeAmount = parseFloat(formatEther(nativeFee)).toFixed(4);

        return {
            dstAmount: dstAmount.toString(),
            minReceivedDst: minReceivedDst.toString(),
            fee: `${feeAmount} ${srcNativeSymbol} + ${haircutDisp} ${hgsSymbol}`,
            priceImpact,
            nativeFee: nativeFee.toString(),
        };
    } catch (e) {
        logger.error(e);
        throw new Error('Unable to estimate swap');
    }
};
