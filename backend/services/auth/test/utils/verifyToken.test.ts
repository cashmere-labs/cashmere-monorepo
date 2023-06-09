import { UserDbDto } from '@cashmere-monorepo/backend-database/src/dto/user';
import { hash as pbkdf2Hash } from 'pbkdf2-password-hash';
import { Address } from 'viem';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

describe('[Auth][Utils] Verify token against database', () => {
    const address: Address = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

    // The tested function
    let verifyRefreshTokenAgainstDb: (
        address: Address,
        hash: string
    ) => Promise<boolean>;

    // Mock params
    let refreshTokenHash: string | undefined;
    let noUser = false;

    beforeAll(async () => {
        // Mock the user repository
        vi.doMock('@cashmere-monorepo/backend-database', () => ({
            getUserRepository: async () => ({
                getByAddress: async (
                    address: Address
                ): Promise<UserDbDto | undefined> =>
                    noUser
                        ? undefined
                        : {
                              address,
                              refreshTokenHash,
                          },
            }),
        }));
        // Import the tested function after mocking dependencies
        ({ verifyRefreshTokenAgainstDb } = await import('../../src'));
    });

    afterEach(() => {
        // Reset spy data
        vi.restoreAllMocks();
    });

    it('[Ok] Accepts a valid hash', async () => {
        noUser = false;
        refreshTokenHash = await pbkdf2Hash('abc');
        // Call the tested function with a valid token
        expect(await verifyRefreshTokenAgainstDb(address, 'abc')).to.be.true;
    });

    it('[Fail] Does not accept a missing user', async () => {
        noUser = true;
        refreshTokenHash = undefined;
        // Call the tested function with a missing user
        expect(await verifyRefreshTokenAgainstDb(address, 'abc')).to.be.false;
    });

    it('[Fail] Does not accept a missing token hash', async () => {
        noUser = false;
        refreshTokenHash = undefined;
        // Call the tested function with a user that does not have a token hash
        expect(await verifyRefreshTokenAgainstDb(address, 'abc')).to.be.false;
    });

    it('[Fail] Does not accept a non-matching token hash', async () => {
        noUser = false;
        refreshTokenHash = await pbkdf2Hash('def');
        // Call the tested function with a non-matching token
        expect(await verifyRefreshTokenAgainstDb(address, 'abc')).to.be.false;
    });

    it('[Fail] Does not accept and does not throw with a malformed token hash', async () => {
        noUser = false;
        refreshTokenHash = 'malformed hash';
        // Call the tested function with a user that has a malformed token hash
        expect(await verifyRefreshTokenAgainstDb(address, 'abc')).to.be.false;
    });
});
