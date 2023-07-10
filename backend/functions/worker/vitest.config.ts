import { defineConfig } from 'vitest/config';

const timeout = process.env.CI ? 50000 : 30000;
export default defineConfig({
    test: {
        name: 'backend/functions/worker',
        hookTimeout: timeout,
        teardownTimeout: timeout,
    },
});
