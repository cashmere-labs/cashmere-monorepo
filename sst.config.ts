import { SSTConfig } from 'sst';
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
        // Remove all resources when non-prod stages are removed
        if (app.stage !== 'prod') {
            app.setDefaultRemovalPolicy('destroy');
        }
        app.setDefaultFunctionProps({
            // Log param's
            logRetention: 'two_weeks',
            // Function generic params
            memorySize: '512 MB',
            timeout: '30 seconds',
            // Runtime and build env
            nodejs: {
                // Minify code for prod
                minify: app.stage === 'prod',
            },
            // Runtime node env
            runtime: 'nodejs18.x',
            // Allow all external call by default
            // allowAllOutbound: true,
            // Disable xray tracing
            tracing: 'disabled',
        });

        // TODO: Unused for now since we don't have any domain setup
        // app.stack(CoreStack);

        // Every API Stack's
        app.stack(SwapParamsStack);
    },
} satisfies SSTConfig;
