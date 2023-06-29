import { Api } from 'sst/node/api';
import { describe, expect, it } from 'vitest';

/**
 * Health-check estimate business logic test
 */
describe('[Stat][Endpoint] statByChain', () => {
    // The api url we will use for our call
    const baseEndpoint = `${Api.StatApiStack.url}`;

    const baseRequest = {
        headers: new Headers(),
        method: 'GET',
    };
    // Ensure it fail if we don't provide any input param
    it("[Fail] Don't exist with wrong method", async () => {
        const result = await fetch(baseEndpoint, baseRequest);
        expect(result.status).toBe(404);
    });

    it('[Fail] chainId query param is not provided', async () => {
        const result = await fetch(
            `${baseEndpoint}/stat-by-chain`,
            baseRequest
        );
        expect(result.status).toBe(400);
    });

    it.only('[Fail] chainId query should be a number', async () => {
        const result = await fetch(
            `${baseEndpoint}stat-by-chain?chainId=test`,
            baseRequest
        );

        expect(result.status).toBe(400);
    });

    // should be ok with good param's
    it("[Ok] Pass with good param's", async () => {
        expect(() =>
            fetch(`${baseEndpoint}stat-by-chain?chainId=1`)
        ).not.toThrow();
    });
}, 50000);
