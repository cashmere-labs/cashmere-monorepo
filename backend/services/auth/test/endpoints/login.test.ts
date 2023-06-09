import { Hex } from 'viem';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { SiweMessageDto } from '../../src';

// Mocked tokens object
const tokensObject = { accessToken: 'a', refreshToken: 'b' };

describe('[Auth][Endpoints] Login endpoint', () => {
    // The tested function
    let login: (
        siweMessage: SiweMessageDto,
        signature: Hex
    ) => Promise<{ accessToken: string; refreshToken: string }>;
    // Various mocks
    const getTokens = vi.fn(() => tokensObject);
    const updateRefreshToken = vi.fn();
    const updateCacheTtlInDb = vi.fn();
    const verifySiweMessage = vi.fn();
    const getFromCache = vi.fn((key: string) => ({ value: key }));

    beforeAll(async () => {
        // Create a utils module mock
        vi.doMock('../../src/utils', () => ({
            getTokens,
            updateRefreshToken,
            verifySiweMessage,
        }));
        // Create a backend-core module mock
        vi.doMock('@cashmere-monorepo/backend-core', () => ({
            getFromCache,
            updateCacheTtlInDb,
        }));
        // Import the tested function after mocking dependencies
        ({ login } = await import('../../src'));
    });

    it('[Ok] Authenticates a user', async () => {
        // Build a siwe message only with used fields
        const message = {
            requestId: 'abc',
            address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        } as unknown as SiweMessageDto;
        // Call the tested function
        expect(await login(message, '0xsignature')).toEqual(tokensObject);
        // And verify the side effects
        expect(getFromCache).toBeCalledWith('nonce:abc');
        expect(verifySiweMessage).toBeCalledWith(
            message,
            '0xsignature',
            'nonce:abc'
        );
        expect(getTokens).toBeCalledWith(message.address);
        expect(updateRefreshToken).toBeCalledWith(
            message.address,
            tokensObject.refreshToken
        );
        expect(updateCacheTtlInDb).toBeCalledWith('nonce:abc', 0);
    });
});
