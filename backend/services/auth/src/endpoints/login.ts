import {
    getFromCache,
    UnauthorizedError,
    updateCacheTtlInDb,
} from '@cashmere-monorepo/backend-core';
import { getUserRepository } from '@cashmere-monorepo/backend-database';
import { hash as pbkdf2Hash } from 'pbkdf2-password-hash';
import { getAddress, Hex, verifyMessage } from 'viem';
import { SiweMessageDto } from '../dto';
import { getTokens } from '../tokens';

/**
 * Verify a SIWE message
 * @param siweMessage
 * @param signature
 * @param nonce
 */
export const verifySiweMessage = async (
    siweMessage: SiweMessageDto,
    signature: Hex,
    nonce?: string
) => {
    // Nonce fetched from cache should match nonce in SIWE message
    if (siweMessage.nonce !== nonce)
        throw new UnauthorizedError('Invalid nonce');

    // Build a SIWE message header
    const messageLines = [
        `${siweMessage.domain} wants you to sign in with your Ethereum account:`,
        `${getAddress(siweMessage.address)}`,
        '',
        `${siweMessage.statement}`,
        '',
        `URI: ${siweMessage.uri}`,
        `Version: ${siweMessage.version}`,
        `Chain ID: ${siweMessage.chainId}`,
        `Nonce: ${nonce}`,
        `Issued At: ${siweMessage.issuedAt}`,
    ];
    // Add optional fields
    if (siweMessage.expirationTime)
        messageLines.push(`Expiration Time: ${siweMessage.expirationTime}`);
    if (siweMessage.notBefore)
        messageLines.push(`Not Before: ${siweMessage.notBefore}`);
    if (siweMessage.requestId)
        messageLines.push(`Request ID: ${siweMessage.requestId}`);
    if (siweMessage.resources) {
        messageLines.push('Resources:');
        siweMessage.resources.forEach((resource) =>
            messageLines.push(`- ${resource}`)
        );
    }
    // Generate a newspace-separated string
    const message = messageLines.join('\n');
    // Throw an error if the signature is invalid
    if (
        !(await verifyMessage({
            address: siweMessage.address,
            message,
            signature,
        }))
    ) {
        throw new UnauthorizedError('Invalid signature');
    }
};

/**
 * Login endpoint
 * @param siweMessage
 * @param signature
 */
export async function login(siweMessage: SiweMessageDto, signature: Hex) {
    // Build the nonce key
    const cacheKey = `nonce:${siweMessage.requestId}`;
    // Retrieve the nonce from cache
    const nonce = (await getFromCache<string>(cacheKey))?.value;
    // Verify message
    await verifySiweMessage(siweMessage, signature, nonce);
    // Shouldn't be able to get here if verification fails, generate tokens
    const tokens = await getTokens(siweMessage.address);
    // Refresh token hash in database
    await (
        await getUserRepository()
    ).updateRefreshTokenHash(
        siweMessage.address,
        await pbkdf2Hash(tokens.refreshToken)
    );
    // Invalidate nonce in cache
    await updateCacheTtlInDb(cacheKey, 0);
    // Return tokens
    return tokens;
}
