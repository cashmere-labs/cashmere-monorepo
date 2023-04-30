import { getHandler } from '@swarmion/serverless-contracts';
import Ajv from 'ajv';
import {
  formatEther,
  formatUnits,
  getAddress,
  getAssetRepository,
  getAssetRouterRepository,
  getBridgeRepository,
  getL0ChainFromChainId,
  getNetworkConfig,
  getUniswapRepository,
  ONE_INCH_SLIPPAGE,
} from '@cashmere-monorepo/blockchain';
import { logger } from '@cashmere-monorepo/serverless-configuration';
import { getEstimateSwapContract } from '@cashmere-monorepo/swap-params-contracts';
import { getAllSwapParamsDatas } from '../../helpers/paramsUtils';

// Used to ensure schema correctness
const ajv = new Ajv();

export const main = getHandler(getEstimateSwapContract, { ajv })(
  async event => {
    const initialTime = new Date().getTime();
    logger.debug(
      { elapsed: initialTime - new Date().getTime() },
      'Enter estimate',
    );
    // Extract and format our param's
    const [srcChainId, srcTokenOriginal, amount, dstChainId, dstTokenOriginal] =
      [
        parseInt(event.queryStringParameters.srcChainId),
        getAddress(event.queryStringParameters.srcToken),
        BigInt(event.queryStringParameters.amount),
        parseInt(event.queryStringParameters.dstChainId),
        getAddress(event.queryStringParameters.dstToken),
      ];
    logger.debug(
      { elapsed: initialTime - new Date().getTime() },
      'Params parsed',
    );

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
        srcTokenOriginal,
        dstChainId,
        dstTokenOriginal,
      );
      logger.debug(
        { elapsed: initialTime - new Date().getTime() },
        "All swap data's fetched",
      );

      // If we need a src swap
      if (needSrcSwap) {
        // Get the LWS Amount post routing
        const { dstAmount: tmpLwsAmount } = await getUniswapRepository(
          srcChainId,
        ).getAmountOut({
          amount,
          fromToken: srcToken,
          toToken: lwsToken,
        });
        lwsAmount = tmpLwsAmount;
        minReceivedLws = (lwsAmount * BigInt(100 - ONE_INCH_SLIPPAGE)) / 100n;
      } else {
        // Otherwise, the swap is just the amount
        minReceivedLws = lwsAmount = amount;
      }
      // Time consuming : 400ms
      logger.debug(
        { elapsed: initialTime - new Date().getTime() },
        'Mint and lws amount computed',
      );

      // Perform swap quotation
      const { potentialOutcome, haircut, minPotentialOutcome } =
        await getAssetRouterRepository(srcChainId).quoteSwaps({
          lwsAssetId: parseInt(lwsAssetId),
          hgsAssetId: parseInt(hgsAssetId),
          dstChainId: getL0ChainFromChainId(dstChainId),
          amount: lwsAmount,
          minAmount: minReceivedLws,
        });
      // Time consuming : 1500ms
      logger.debug(
        { elapsed: initialTime - new Date().getTime() },
        'Potential outcome computed',
      );

      // Get the amount's
      const hgsAmount: bigint = potentialOutcome;
      const minReceivedHgs: bigint = minPotentialOutcome;
      if (needDstSwap) {
        // Get the dst amount and min received dst amount from uniswap
        const amountOutResult = await getUniswapRepository(
          dstChainId,
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
      // Less time consuming : 200ms
      logger.debug(
        { elapsed: initialTime - new Date().getTime() },
        'Hgs amount computed',
      );

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
        'Swap estimate result',
      );
      const priceImpact = '0';
      logger.debug(
        { elapsed: initialTime - new Date().getTime() },
        'Logging performed',
      );

      logger.debug(`haircut ${haircut}`);

      // Get the HGS token info
      const dstAssetRepository = getAssetRepository(dstChainId);
      const hgsSymbol = await dstAssetRepository.tokenSymbol(hgsToken);
      const hgsDecimals = await dstAssetRepository.tokenDecimal(hgsToken);
      const haircutDisp = parseFloat(formatUnits(haircut, hgsDecimals)).toFixed(
        4,
      );
      logger.debug(
        { elapsed: initialTime - new Date().getTime() },
        "Dst token info's fetched",
      );

      // Get the native fee's
      const nativeFee = await getBridgeRepository(srcChainId).getSwapFeeL0(
        getL0ChainFromChainId(dstChainId),
      );
      logger.debug(
        { elapsed: initialTime - new Date().getTime() },
        "Native fee's fetched",
      );

      // Build some return param's
      const srcNativeSymbol =
        getNetworkConfig(srcChainId).chain.nativeCurrency.symbol;
      const feeAmount = parseFloat(formatEther(nativeFee)).toFixed(4);
      logger.debug(
        { elapsed: initialTime - new Date().getTime() },
        "Src token info's fetched",
      );

      return {
        statusCode: 200,
        body: {
          dstAmount: dstAmount.toString(),
          minReceivedDst: minReceivedDst.toString(),
          fee: `${feeAmount} ${srcNativeSymbol} + ${haircutDisp} ${hgsSymbol}`,
          priceImpact,
          nativeFee: nativeFee.toString(),
        },
      };
    } catch (e) {
      logger.error(e);
      throw new Error('Unable to estimate swap');
    }
  },
);
