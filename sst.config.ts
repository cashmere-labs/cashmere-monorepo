import { SSTConfig } from 'sst';
import { CoreStack } from './backend/core/stacks/CoreStack';
import { SwapParamsStack } from './backend/functions/swap-params/src/SwapParamsStack';

export default {
    config(_input) {
        return {
            profile: 'monorepo-swarmion-dev',
            name: 'cashmere-monorepo',
            region: 'us-east-1',
        };
    },
    stacks(app) {
        app.stack(CoreStack);

        // Every API Stack's
        app.stack(SwapParamsStack);
    },
} satisfies SSTConfig;
