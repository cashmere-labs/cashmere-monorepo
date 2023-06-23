import { buildSstApiGatewayContract } from '@cashmere-monorepo/shared-contract-core';
import { Type } from '@sinclair/typebox';

// Typebox schema for the response body
export const healthCheckEndpointResponseBodyType = Type.Object({
    status: Type.String(),
    message: Type.String(),
    timestamp: Type.String(),
});

// SST API Gateway contract for the health check endpoint
export const healthCheckContract = buildSstApiGatewayContract({
    id: 'test',
    path: '/health-check',
    method: 'GET',
    responseSchema: healthCheckEndpointResponseBodyType,
});
