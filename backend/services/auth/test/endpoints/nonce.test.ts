import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('[Auth][Endpoints] Nonce endpoint', () => {
    // The tested function
    let generateNewNonce: (requestId: string) => Promise<{ nonce: string }>;
    // Mock parameter
    let hasNonceInCache = false;
    const ConflictError = class extends Error {};

    beforeAll(async () => {
        // Mock the backend-core module
        vi.doMock('@cashmere-monorepo/backend-core', () => ({
            getFromCache: () =>
                hasNonceInCache ? { value: 'abc' } : undefined,
            setInCache: () => null,
            ConflictError,
        }));
        // Import the tested function after mocking dependencies
        ({ generateNewNonce } = await import('../../src'));
    });

    it('[Ok] Generates a nonce', async () => {
        // Successful call
        const response = await generateNewNonce('abc');
        expect(response).toHaveProperty('nonce');
    });

    it('[Fail] Reports a duplicate request id', async () => {
        // Call with a duplicate request id
        hasNonceInCache = true;
        await expect(generateNewNonce('abc')).rejects.toThrow(ConflictError);
    });
});
