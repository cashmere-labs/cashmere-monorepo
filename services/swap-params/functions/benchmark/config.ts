import { getHandlerPath, LambdaFunction } from '@swarmion/serverless-helpers';

const config: LambdaFunction = {
  environment: {},
  handler: getHandlerPath(__dirname),
  events: [],
  timeout: 900,
};

export default config;
