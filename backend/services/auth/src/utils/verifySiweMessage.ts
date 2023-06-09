import { UnauthorizedError } from '@cashmere-monorepo/backend-core';
import { getAddress, Hex, verifyMessage } from 'viem';
import { SiweMessageDto } from '../dto';

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
