import { getHandler } from '@swarmion/serverless-contracts';
import Ajv from 'ajv';
import {
  formatEther,
  formatUnits,
  getAddress,
  getAllSwapParamsDatas,
  getAssetRouterRepository,
  getUniswapRepository,
  ONE_INCH_SLIPPAGE,
} from '@cashmere-monorepo/blockchain';
import { logger } from '@cashmere-monorepo/serverless-configuration';
import { getEstimateSwapContract } from '@cashmere-monorepo/swap-params-contracts';

// Used to ensure schema correctness
const ajv = new Ajv();

export const main = getHandler(getEstimateSwapContract, { ajv })(
  async event => {
    // Extract and format our param's
    const [srcChainId, srcTokenOriginal, amount, dstChainId, dstTokenOriginal] =
      [
        parseInt(event.queryStringParameters.srcChainId),
        getAddress(event.queryStringParameters.srcToken),
        BigInt(event.queryStringParameters.amount),
        parseInt(event.queryStringParameters.dstChainId),
        getAddress(event.queryStringParameters.dstToken),
      ];

    try {
      // Get all the swap params
      let lwsAmount: bigint,
        dstAmount: bigint,
        minReceivedLws: bigint,
        minReceivedDst: bigint;
      const {
        srcNetwork,
        srcToken,
        dstNetwork,
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

      // If we need a src swap
      if (needSrcSwap) {
        // Get the LWS Amount post routing
        const tmpLwsAmount = (
          await srcNetwork.contracts.uniswapRouterGetAmoutOut(
            amount,
            srcToken,
            lwsToken,
          )
        )[1];
        if (tmpLwsAmount === undefined) {
          throw new Error('Unable to determine LWS amount');
        }
        lwsAmount = tmpLwsAmount;
        minReceivedLws = (lwsAmount * BigInt(100 - ONE_INCH_SLIPPAGE)) / 100n;
      } else {
        // Otherwise, the swap is just the amount
        minReceivedLws = lwsAmount = amount;
      }

      // Perform swap quotation
      const { potentialOutcome, haircut, minPotentialOutcome } =
        await getAssetRouterRepository(srcChainId).quoteSwaps({
          lwsAssetId: parseInt(lwsAssetId),
          hgsAssetId: parseInt(hgsAssetId),
          dstChainId: parseInt(dstNetwork.config.l0ChainId),
          amount: lwsAmount,
          minAmount: minReceivedLws,
        });

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

      //this.logger.log(`haircut ${haircut}`);
      // Get the HGS token info
      const hgsSymbol = await dstNetwork.contracts.tokenSymbol(hgsToken);
      const hgsDecimals = await dstNetwork.contracts.tokenDecimal(hgsToken);
      const haircutDisp = parseFloat(formatUnits(haircut, hgsDecimals)).toFixed(
        4,
      );

      const nativeFee = await srcNetwork.contracts.swapFeeL0(
        dstNetwork.config.l0ChainId,
      );

      return {
        statusCode: 200,
        body: {
          dstAmount: dstAmount.toString(),
          minReceivedDst: minReceivedDst.toString(),
          fee: `${parseFloat(formatEther(nativeFee)).toFixed(4)} ${
            srcNetwork.config.chain.nativeCurrency.symbol
          } + ${haircutDisp} ${hgsSymbol}`,
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
