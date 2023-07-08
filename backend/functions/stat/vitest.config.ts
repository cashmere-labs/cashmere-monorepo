import path from 'path';
import { defineConfig } from 'vitest/config';

const timeout = process.env.CI ? 50000 : 30000;
export default defineConfig({
    test: {
        name: 'backend/functions/stat',
        hookTimeout: timeout,
    },
    resolve: {
        alias: {
            '@cashmere-monorepo/backend-core/contracts/MultiContractApiGatewayRoute':
                path.resolve(
                    __dirname,
                    '../../core/src/contracts/MultiContractApiGatewayRoute.ts'
                ),
        },
    },
});
