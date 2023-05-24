import { CustomType } from '@cashmere-monorepo/shared-contract-core';
import { Type } from '@sinclair/typebox';

// Typebox schema for SIWE message
export const SiweMessageType = Type.Object({
    address: CustomType.Address(),
    chainId: Type.Number(),
    issuedAt: Type.String(),
    uri: Type.String(),
    nonce: Type.String(),
    expirationTime: Type.Optional(Type.String()),
    notBefore: Type.Optional(Type.String()),
    domain: Type.String(),
    version: Type.Literal('1'),
    requestId: Type.String(),
    statement: Type.String(),
    resources: Type.Optional(Type.Array(Type.String())),
});
