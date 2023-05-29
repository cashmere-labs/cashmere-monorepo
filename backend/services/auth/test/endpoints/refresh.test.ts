import { Address } from 'viem';
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('[Auth][Endpoints] Login endpoint', () => {
    // The tested function
    let refresh: (
        address: Address
    ) => Promise<{ accessToken: string; refreshToken: string }>;
    const getTokens = vi.fn(() => ({ accessToken: 'a', refreshToken: 'b' }));
    // Various mocks
    const updateRefreshToken = vi.fn();

    beforeAll(async () => {
        // Mock dependencies
        vi.doMock('../../src/utils', () => ({
            getTokens,
            updateRefreshToken,
        }));
        // Import the tested function after mocking dependencies
        ({ refresh } = await import('../../src'));
    });

    it('[Ok] Refreshes tokens', async () => {
        // Make the call and check returned value
        expect(await refresh('0xaddress')).toEqual({
            accessToken: 'a',
            refreshToken: 'b',
        });
        // Verify the side effects
        expect(getTokens).toBeCalledWith('0xaddress');
        expect(updateRefreshToken).toBeCalledWith('0xaddress', 'b');
    });
});
