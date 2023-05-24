import {
    buildSstApiGatewayContract,
    CustomType,
} from '@cashmere-monorepo/shared-contract-core/src';

// Get the api path into account when building the contract
// TODO : Maybe an export of the whole API routes contracts, with path? Used by front & back
export const logoutContract = buildSstApiGatewayContract({
    id: 'auth-logout',
    path: '/auth/logout',
    method: 'POST',
    requestContextSchema: CustomType.AuthRequestContext,
});