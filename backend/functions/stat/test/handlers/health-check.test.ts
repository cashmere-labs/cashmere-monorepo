import { Api } from 'sst/node/api';
import { describe, expect, it } from 'vitest';

/**
 * Health-check estimate business logic test
 */
describe('[Stat][Endpoint] HealthCheck', () => {
    // The api url we will use for our call
    const baseEndpoint = `${Api.StatApiStack.url}`;

    // Ensure it fail if we don't provide any input param
    it("[Fail] Don't exist with wrong method", async () => {
        const result = await fetch(baseEndpoint);
        expect(result.status).toBe(404);
    });

    // should be ok with good param's
    it("[Ok] Pass with good param's", async () => {
        const result = await fetch(`${baseEndpoint}health-check`);
        expect(result.status).toBe(200);
    });
}, 50000);
