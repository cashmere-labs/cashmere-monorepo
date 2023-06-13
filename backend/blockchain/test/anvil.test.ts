import { describe, expect, it } from 'vitest';
import { anvilClient, testClient } from './_setup';

describe('[Backend][Blockchain] Anvil check', async () => {
    it('test block mining', async () => {
        // Get current block number
        const currentBlock = await anvilClient.getBlockNumber({ maxAge: 0 });
        // Mine a block
        await testClient.mine({ blocks: 1 });
        // Check that block number has increased
        expect(await anvilClient.getBlockNumber({ maxAge: 0 })).toEqual(
            currentBlock + 1n
        );
    });
});
