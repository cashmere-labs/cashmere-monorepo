import { Address } from 'viem';

// SIWE message interface
export interface SiweMessageDto {
    address: Address;
    chainId: number;
    issuedAt: string;
    uri: string;
    nonce: string;
    expirationTime?: string;
    notBefore?: string;
    domain: string;
    version: '1';
    requestId: string;
    statement: string;
    resources?: string[];
}
