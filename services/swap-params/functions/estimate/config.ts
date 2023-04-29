import { getTrigger } from '@swarmion/serverless-contracts';
import { getHandlerPath, LambdaFunction } from '@swarmion/serverless-helpers';

import { getEstimateSwapContract } from '@cashmere-monorepo/swap-params-contracts';

const config: LambdaFunction = {
  environment: {},
  handler: getHandlerPath(__dirname),
  events: [getTrigger(getEstimateSwapContract)],
};

export default config;
