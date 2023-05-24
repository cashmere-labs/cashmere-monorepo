import { getUserRepository } from '@cashmere-monorepo/backend-database';
import { compare as pbkdf2Compare } from 'pbkdf2-password-hash';
import { Address } from 'viem';

export async function verifyRefreshTokenAgainstDb(
    address: Address,
    token: string
) {
    const dbUser = await (await getUserRepository()).getByAddress(address);
    if (!dbUser || !dbUser.refreshTokenHash) return false;
    try {
        return pbkdf2Compare(token, dbUser.refreshTokenHash);
    } catch (e) {
        return false;
    }
}
