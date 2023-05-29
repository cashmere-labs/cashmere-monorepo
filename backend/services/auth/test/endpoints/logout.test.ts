import { Address } from 'viem';
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('[Auth][Endpoints] Logout endpoint', () => {
    // The tested function
    let logout: (address: Address) => any;
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
        ({ logout } = await import('../../src/endpoints/logout'));
    });

    it('[Ok] Logs a user out', async () => {
        const address = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
        // Call the tested function
        await logout(address);
        // Verify the side effects
        expect(updateRefreshTokenHash).toBeCalledWith(address, 'invalid hash');
    });
});
