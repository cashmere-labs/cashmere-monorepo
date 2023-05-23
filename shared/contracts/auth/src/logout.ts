import { buildSstApiGatewayContract } from '@cashmere-monorepo/shared-contract-core/src';
import { Type } from '@sinclair/typebox';

export const logoutHeadersType = Type.Object({
    authorization: Type.RegEx(/^Bearer .+$/),
});

// Get the api path into account when building the contract
// TODO : Maybe an export of the whole API routes contracts, with path? Used by front & back
export const logoutContract = buildSstApiGatewayContract({
    id: 'auth-logout',
    path: '/auth/logout',
    method: 'POST',
    headersSchema: logoutHeadersType,
});
