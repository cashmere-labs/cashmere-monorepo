import { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { handler } from '../../src/handlers/healthCheck';

/**
 * Health-check estimate business logic test
 */

describe('[Stat][Endpoint] HealthCheck', () => {
    let healthCheckhandlerToTest: typeof handler;
    beforeAll(async () => {
        ({ handler: healthCheckhandlerToTest } = await import(
            '../../src/handlers/healthCheck'
        ));
    });

    afterEach(() => {
        // Reset the mocks
        vi.clearAllMocks();
    });

    // should be ok with good param's
    it("[Ok] Pass with good param's", async () => {
        const result = await healthCheckhandlerToTest(
            {} as APIGatewayProxyEventV2,
            {} as Context
        );
        expect(result.statusCode).toBe(200);
    });
});
