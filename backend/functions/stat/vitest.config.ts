import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        name: 'backend/functions/stat',
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
