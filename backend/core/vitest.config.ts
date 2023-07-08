import { defineConfig } from 'vitest/config';

const timeout = process.env.CI ? 50000 : 30000;

export default defineConfig({
    test: {
        name: 'backend/core',
        hookTimeout: timeout,
        teardownTimeout: timeout,
    },
});
