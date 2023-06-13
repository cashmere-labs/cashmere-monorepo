import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        name: 'backend/blockchain',
        setupFiles: 'test/_setup.ts',
        coverage: {
            reporter: ['html', 'text', 'json', 'json-summary'],
            provider: 'istanbul',
        },
    },
});
