import { getAddress } from 'viem';
import {
    generatePrivateKey,
    privateKeyToAccount,
    signMessage,
} from 'viem/accounts';
import { describe, expect, it } from 'vitest';
import { SiweMessageDto, verifySiweMessage } from '../../src';

describe('[Auth][Utils] SIWE message validation', () => {
    // Test constants
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    const nonce = '42';

    // Base SIWE message data
    const messageData: SiweMessageDto = {
        domain: 'abc',
        address: account.address,
        statement: 'def',
        uri: 'ghi',
        version: '1',
        chainId: 1,
        nonce,
        issuedAt: 'some time',
        requestId: 'request id',
    };

    // Signature generate helper
    const generateSignature = async (siweMessage: SiweMessageDto) => {
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
            `Nonce: ${siweMessage.nonce}`,
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
        return signMessage({ message, privateKey });
    };

    it(`[Ok] Approves a message with only required fields`, async () => {
        const message = {
            ...messageData,
        };
        // Does not revert with a valid message containing no optional fields
        await expect(
            verifySiweMessage(message, await generateSignature(message), nonce)
        ).resolves;
    });

    it(`[Ok] Approves a message with all optional fields`, async () => {
        const message = {
            ...messageData,
            expirationTime: 'exp time',
            notBefore: 'not before',
            resources: ['abc', 'def'],
        };
        // Does not revert with a valid message containing all optional fields
        await expect(
            verifySiweMessage(message, await generateSignature(message), nonce)
        ).resolves;
    });

    it(`[Fail] Declines a message with a wrong nonce`, async () => {
        const message = {
            ...messageData,
        };
        // Reverts with a wrong nonce
        await expect(async () =>
            verifySiweMessage(
                message,
                await generateSignature(message),
                'wrong nonce'
            )
        ).rejects.toThrowError('unauthorized-error');
    });

    it(`[Fail] Declines a message with a wrong signature`, async () => {
        const message = {
            ...messageData,
        };
        // Reverts with an invalid signature (the signed data is different to the passed data)
        await expect(async () =>
            verifySiweMessage(
                message,
                await generateSignature({ ...message, expirationTime: '1' }),
                nonce
            )
        ).rejects.toThrowError('unauthorized-error');
    });
});
