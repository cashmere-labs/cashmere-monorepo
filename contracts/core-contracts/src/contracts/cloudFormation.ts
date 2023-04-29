import { CloudFormationContract } from '@swarmion/serverless-contracts';

import { projectName } from '@cashmere-monorepo/serverless-configuration';

export const httpApiResourceContract = new CloudFormationContract({
  id: 'core-httpApi',
  name: `CoreHttpApi-${projectName}`,
});
