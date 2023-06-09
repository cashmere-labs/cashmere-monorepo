import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        coverage: {
            provider: 'istanbul',
            reporter: ['html', 'text', 'json', 'json-summary'],
            lines: 50,
            branches: 50,
            functions: 50,
            statements: 50,
        },
    },
});
