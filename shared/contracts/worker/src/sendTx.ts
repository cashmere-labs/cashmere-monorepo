import { CustomType } from '@cashmere-monorepo/shared-contract-core';
import { Type } from '@sinclair/typebox';
import { TypeCompiler } from '@sinclair/typebox/compiler';

/**
 * Typebox schema for the send tx queue
 */
const sendTxQueueType = Type.Object({
    chainId: Type.Number(),
    priority: Type.Number(),
    target: CustomType.Address(),
    data: CustomType.Hex(),
    securityHash: Type.String(),
});

/**
 * Get the type compiler for our send tx queue
 */
export const getSendTxQueueTypeCompiler = () =>
    TypeCompiler.Compile(sendTxQueueType);
