import { Address } from 'viem';
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('[Auth][Utils] Get tokens', async () => {
    // The tested function
    let getTokens: (address: Address) => {
        accessToken: string;
        refreshToken: string;
    };

    // Signers mocks
    const accessTokenSigner = vi.fn(() => 'accessTokenSigner');
    const refreshTokenSigner = vi.fn(() => 'refreshTokenSigner');

    beforeAll(async () => {
        // Mock dependencies
        vi.doMock('../../src/utils/jwt', () => ({
            getAccessSigner: () => accessTokenSigner,
            getRefreshSigner: () => refreshTokenSigner,
        }));
        // Import the tested function after mocking dependencies
        ({ getTokens } = await import('../../src/utils/getTokens'));
    });

    it('[Ok] Generates tokens using corresponding signers', () => {
        const sub = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
        // Call the function and check returned value
        expect(getTokens(sub)).toEqual({
            accessToken: 'accessTokenSigner',
            refreshToken: 'refreshTokenSigner',
        });
        // Verify the side effects
        expect(accessTokenSigner).toBeCalledWith({ sub });
        expect(refreshTokenSigner).toBeCalledWith({ sub });
    });
});
