import {
    buildSstApiGatewayContract,
    CustomType,
} from '@cashmere-monorepo/shared-contract-core/src';

/**
 * Contract for the logout endpoint
 */
export const logoutContract = buildSstApiGatewayContract({
    id: 'auth-logout',
    path: '/auth/logout',
    method: 'POST',
    requestContextSchema: CustomType.AuthRequestContext,
});
