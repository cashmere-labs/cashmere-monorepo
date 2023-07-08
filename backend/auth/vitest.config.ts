import { defineConfig } from 'vitest/config';

const timeout = process.env.CI ? 50000 : 30000;
export default defineConfig({
    test: {
        name: 'backend/auth',
        coverage: {
            reporter: ['html', 'text', 'json', 'json-summary'],
            provider: 'istanbul',
        },
        hookTimeout: timeout,
        teardownTimeout: timeout,
    },
});
