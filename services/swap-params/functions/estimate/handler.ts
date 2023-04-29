import { getHandler } from '@swarmion/serverless-contracts';
import Ajv from 'ajv';
import {
  formatEther,
  formatUnits,
  getAddress,
  getAllSwapParamsDatas,
  ONE_INCH_SLIPPAGE,
  pad,
} from '@cashmere-monorepo/blockchain';
import { getEstimateSwapContract } from '@cashmere-monorepo/swap-params-contracts';

// Used to ensure schema correctness
const ajv = new Ajv();

export const handler = getHandler(getEstimateSwapContract, { ajv })(
  async event => {
    const args = event.queryStringParameters.amount;
    console.log(args);
    await Promise.resolve();

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
      if (needSrcSwap) {
        lwsAmount = (
          await srcNetwork.contracts.uniswapRouterGetAmoutOut(
            amount,
            srcToken,
            lwsToken,
          )
        )[1]!;
        minReceivedLws = (lwsAmount * BigInt(100 - ONE_INCH_SLIPPAGE)) / 100n;
      } else {
        minReceivedLws = lwsAmount = amount;
      }

      const quotationsCallResults =
        await srcNetwork.contracts.assetRouterQuoteSwapMulticall([
          // With LWS Amount
          {
            srcPoolId: parseInt(lwsAssetId),
            dstPoolId: parseInt(hgsAssetId),
            dstChainId: parseInt(dstNetwork.config.l0ChainId),
            amount: lwsAmount,
            minAmount: 0n,
            refundAddress: pad('0x00', { size: 20 }),
            to: pad('0x00', { size: 20 }),
            payload: '0x00',
          },
          // With Min LWS Amount
          {
            srcPoolId: parseInt(lwsAssetId),
            dstPoolId: parseInt(hgsAssetId),
            dstChainId: parseInt(dstNetwork.config.l0ChainId),
            amount: minReceivedLws,
            minAmount: 0n,
            refundAddress: pad('0x00', { size: 20 }),
            to: pad('0x00', { size: 20 }),
            payload: '0x00',
          },
        ]);
      // Ensure no error occurred
      quotationsCallResults.map(callResult => {
        if (callResult.status !== 'success') {
          /*this.logger.warn(
            `Asset router quotation failed with status : ${callResult.status}`,
            callResult
          );*/
          throw new Error('Unable to call asset router quotation');
        }
      });

      // Extract the data
      const potentialOutcome = quotationsCallResults[0]?.result?.[0];
      const haircut = quotationsCallResults[0]?.result?.[1];
      const minPotentialOutcome = quotationsCallResults[1]?.result?.[0];

      // Ensure we have the data
      if (!potentialOutcome || !haircut || !minPotentialOutcome) {
        throw new Error('Unable to get quotations');
      }

      // Get the amount's
      const hgsAmount: bigint = potentialOutcome;
      const minReceivedHgs: bigint = minPotentialOutcome;
      if (needDstSwap) {
        const callResults =
          await dstNetwork.contracts.uniswapRouterGetAmoutOutMulticall([
            // Hgs dst amount
            {
              fromAmount: BigInt(hgsAmount),
              fromToken: hgsToken,
              toToken: dstToken,
            },
            // Hgs min received dst amount
            {
              fromAmount: BigInt(minReceivedHgs),
              fromToken: hgsToken,
              toToken: dstToken,
            },
          ]);

        // Ensure no error occurred
        callResults.map(callResult => {
          if (callResult.status !== 'success') {
            /*this.logger.warn(
              `Uniswap router get amount failed with status : ${callResult.status}`,
              callResult
            );*/
            throw new Error('Unable to call uniswap router get amount');
          }
        });

        // Get the dst amount from the first call
        dstAmount = callResults[0]?.result?.[1] ?? 0n;
        //this.logger.log(`DST Amount ${dstAmount}`);

        // Get the min received dst amount for the second call
        const tmpDstAmount = callResults[1]?.result?.[1] ?? 0n;
        //this.logger.log(`Temp DST Amount for min ${tmpDstAmount}`);
        minReceivedDst =
          (tmpDstAmount * BigInt(100 - ONE_INCH_SLIPPAGE)) / 100n;
      } else {
        dstAmount = hgsAmount;
        minReceivedDst = BigInt(minReceivedHgs);
      }

      /*this.logger.log('Swap estimate result :', {
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
      });*/
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
      //this.logger.error('Estimate call error', e);

      return {
        statusCode: 500,
        body: `Internal server error: ${JSON.stringify(e)}`,
      };
    }
  },
);
