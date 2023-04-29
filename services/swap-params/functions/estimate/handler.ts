import { getHandler } from '@swarmion/serverless-contracts';
import Ajv from 'ajv';
import { getEstimateSwapContract } from '@cashmere-monorepo/swap-params-contracts';

const ajv = new Ajv();

export const handler = getHandler(getEstimateSwapContract, { ajv })(
  async event => {
    const args = event.queryStringParameters.amount;
    console.log(args);
    await Promise.resolve();

    return {
      statusCode: 200,
      body: {
        dstAmount: 'ok',
        minReceivedDst: 'ok',
        fee: 'ok',
        priceImpact: 'ok',
        nativeFee: 'ok',
      },
    };
  },
);
