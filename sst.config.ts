import { SSTConfig } from 'sst';
import { use } from 'sst/constructs';
import { AuthStack } from './backend/auth/AuthStack';
import { CoreStack } from './backend/core/stacks/CoreStack';
import { DatabaseStack } from './backend/database/DatabaseStack';
import { ProgressStack } from './backend/functions/progress/ProgressStack';
import { SwapParamsStack } from './backend/functions/swap-params/SwapParamsStack';
import { WorkerStack } from './backend/functions/worker/WorkerStack';

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
        const { cachingTable, mutexTable } = use(CoreStack);
        app.addDefaultFunctionBinding([cachingTable, mutexTable]);

        // Auth stack (since it will be used to protect all other stacks)
        app.stack(AuthStack);

        // Every API Stack's
        app.stack(SwapParamsStack);
        app.stack(ProgressStack);
        app.stack(WorkerStack);
    },
} satisfies SSTConfig;
