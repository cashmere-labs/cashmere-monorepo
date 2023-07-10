import { defineConfig } from 'vitest/config';

const timeout = process.env.CI ? 50000 : 30000;
export default defineConfig({
    test: {
        name: 'backend/functions/swap-params',
        hookTimeout: timeout,
        teardownTimeout: timeout,
    },
});
