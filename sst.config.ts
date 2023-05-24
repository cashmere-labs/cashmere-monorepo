import { SSTConfig } from 'sst';
import { use } from 'sst/constructs';
import { CoreStack } from './backend/core/stacks/CoreStack';
import { DatabaseStack } from './backend/database/DatabaseStack';
import { AuthStack } from './backend/functions/auth/AuthStack';
import { ProgressStack } from './backend/functions/progress/ProgressStack';
import { SwapParamsStack } from './backend/functions/swap-params/SwapParamsStack';

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
            // TODO: Function name builder (should take api base path + url endpoint if any, otherwise handler filename)
            // Runtime and build env
            nodejs: {
                // Minify code for prod
                minify: app.stage === 'prod',
            },
            // Runtime node env
            runtime: 'nodejs18.x',
            // Disable xray tracing
            tracing: 'disabled',
        });

        // Our core stack (main api, caching, database)
        app.stack(CoreStack);
        app.stack(DatabaseStack);

        // Add the db env to our default function env
        app.addDefaultFunctionEnv(use(DatabaseStack).environment);

        // Bind the caching table to all of our stack
        app.addDefaultFunctionBinding([use(CoreStack).cachingTable]);

        // Every API Stack's
        app.stack(SwapParamsStack);
        app.stack(ProgressStack);
        app.stack(AuthStack);
    },
} satisfies SSTConfig;
