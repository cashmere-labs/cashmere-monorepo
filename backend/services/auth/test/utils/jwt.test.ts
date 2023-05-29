import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

describe('[Auth][Utils] JWT utils', () => {
    // The tested functions
    let getAccessSigner: () => any,
        getAccessVerifier: () => any,
        getRefreshSigner: () => any,
        getRefreshVerifier: () => any;
    // Mocks
    const createSigner: (options: { key: string; expiresIn: number }) => any =
        vi.fn(({ key }) => `signer-${key}`);
    const createVerifier: (options: { key: string }) => any = vi.fn(
        ({ key }) => `verifier-${key}`
    );

    beforeAll(async () => {
        // Mock dependencies
        vi.doMock('fast-jwt', () => ({
            createSigner,
            createVerifier,
        }));
        // Mock secret keys
        vi.doMock('sst/node/config', () => ({
            Config: {
                JWT_ACCESS_SECRET: 'as',
                JWT_REFRESH_SECRET: 'rs',
            },
        }));
        // Import the tested functions after mocking dependencies
        ({
            getAccessSigner,
            getAccessVerifier,
            getRefreshSigner,
            getRefreshVerifier,
        } = await import('../../src/utils'));
    });

    afterEach(() => {
        // Reset spy states after each test
        vi.restoreAllMocks();
    });

    it('[Ok] Creates an access signer', () => {
        // Call the tested function and check returned value
        expect(getAccessSigner()).toEqual('signer-as');
        // Verify the side effects
        expect(createSigner).toBeCalledWith({
            key: 'as',
            expiresIn: 15 * 60 * 1000,
        });
    });

    it('[Ok] Creates an access verifier', () => {
        // Call the tested function and check returned value
        expect(getAccessVerifier()).toEqual('verifier-as');
        // Verify the side effects
        expect(createVerifier).toBeCalledWith({ key: 'as' });
    });

    it('[Ok] Creates a refresh signer', () => {
        // Call the tested function and check returned value
        expect(getRefreshSigner()).toEqual('signer-rs');
        // Verify the side effects
        expect(createSigner).toBeCalledWith({
            key: 'rs',
            expiresIn: 7 * 24 * 60 * 60 * 1000,
        });
    });

    it('[Ok] Creates a refresh verifier', () => {
        // Call the tested function and check returned value
        expect(getRefreshVerifier()).toEqual('verifier-rs');
        // Verify the side effects
        expect(createVerifier).toBeCalledWith({ key: 'rs' });
    });
});
