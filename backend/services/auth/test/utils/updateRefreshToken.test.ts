import { compare as pbkdf2Compare } from 'pbkdf2-password-hash';
import { Address, isAddressEqual } from 'viem';
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('[Auth][Utils] Update refresh token', () => {
    const address: Address = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

    // The tested function
    let updateRefreshToken: (a: Address, t: string) => Promise<void>;
    // Various mocks
    const updateRefreshTokenHash = vi.fn();

    beforeAll(async () => {
        // Mock the user repository
        vi.doMock('@cashmere-monorepo/backend-database', () => ({
            getUserRepository: async () => ({
                updateRefreshTokenHash,
            }),
        }));
        // Import the tested function after mocking dependencies
        updateRefreshToken = (await import('../../src')).updateRefreshToken;
    });

    it('[Ok] Calls the update function', async () => {
        // Make the call
        await updateRefreshToken(address, 'abc');
        // Verify the user repository method call
        const [argAddress, argHash] = updateRefreshTokenHash.mock.calls[0];
        expect(isAddressEqual(argAddress, address)).to.be.true;
        expect(await pbkdf2Compare('abc', argHash)).to.be.true;
    });
});
