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
        const result = await healthCheckhandlerToTest({}, {});
        expect(result.statusCode).toBe(200);
    });
});
