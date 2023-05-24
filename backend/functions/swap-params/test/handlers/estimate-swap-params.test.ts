import { Api } from 'sst/node/api';
import { describe, expect, it } from 'vitest';

/**
 * Swap estimate business logic test
 */
describe('[Swap][Endpoint] Estimate', () => {
    // The api url we will use for our call
    const baseEndpoint = `${Api.SwapApi.url}estimate`;
    const baseRequest = {
        headers: new Headers(),
        method: 'GET',
    };

    // Build a query url
    const buildUrl = (params: Record<string, string>) =>
        `${baseEndpoint}?${new URLSearchParams(params)}`;

    // Ensure it fail if we don't provide any input param
    it('[Fail] No input param', async () => {
        const result = await fetch(baseEndpoint, baseRequest);
        expect(result.status).toBe(400);
    });

    // Ensure it fail if we don't use the adequate method
    it("[Fail] Don't exist with wrong method ", async () => {
        const result = await fetch(baseEndpoint, {
            ...baseRequest,
            method: 'POST',
        });
        expect(result.status).toBe(404);
    });

    // Ensure it fail if we don't use the adequate method
    it('[Fail] Not all param are present', async () => {
        const url = buildUrl({
            srcChainId: '59140',
            srcToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
            dstChainId: '80001',
            dstToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        });
        const result = await fetch(url, baseRequest);
        expect(result.status).toBe(400);
    });

    // Ensure it fail if we don't use the adequate method
    it("[Ok] Don't fail with extra param", async () => {
        const url = buildUrl({
            srcChainId: '59140',
            srcToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
            amount: '100000000000000000000',
            dstChainId: '80001',
            dstToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
            extra: 'extra',
        });
        const result = await fetch(url, baseRequest);
        expect(result.status).toBe(200);
    });

    // Ensure it fail if we don't use the adequate method
    it("[Ok] Pass with good param's", async () => {
        const url = buildUrl({
            srcChainId: '59140',
            srcToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
            amount: '100000000000000000000',
            dstChainId: '80001',
            dstToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        });
        const result = await fetch(url, baseRequest);
        expect(result.status).toBe(200);
    });
});
