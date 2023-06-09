import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        name: 'backend/auth',
        coverage: {
            reporter: ['html', 'text', 'json', 'json-summary'],
            provider: 'istanbul',
        },
    },
});
