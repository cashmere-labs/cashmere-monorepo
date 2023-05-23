import * as console from 'console';
import { Api } from 'sst/node/api';
import { describe, it } from 'vitest';

/**
 * Swap estimate business logic test
 */
describe('[Swap][Endpoint] Estimate', () => {
    // Ensure response formatting work
    it('Input param assertions', async () => {
        const apiUrl = Api.SwapApi.url;
        console.log(apiUrl);
        // TODO: Startup our typebox helper to call function
        const result = await fetch(`${apiUrl}estimate`);
        console.log(result);
    });
});
