import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        coverage: {
            provider: 'istanbul',
            reporter: ['html', 'text', 'json', 'json-summary'],
            lines: 80,
            branches: 80,
            functions: 80,
            statements: 80,
        },
    },
});
