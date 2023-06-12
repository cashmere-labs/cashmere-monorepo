import {
    BlockchainConfig,
    getNetworkConfigAndClient,
    networkConfigs,
} from '@cashmere-monorepo/shared-blockchain';
import { Anvil, createAnvil } from '@viem/anvil';
import { TestClient, createTestClient, http } from 'viem';
import { polygonMumbai } from 'viem/chains';
import { afterAll, beforeAll, beforeEach, describe, it, vi } from 'vitest';

describe('[Backend][Blockchain] Aggregator repository', async () => {
    let anvil: Anvil;
    let testClient: TestClient;

    beforeAll(async () => {
        anvil = createAnvil({
            forkUrl: polygonMumbai.rpcUrls.public.http[0],
        });
        await anvil.start();

        testClient = createTestClient({
            chain: polygonMumbai,
            mode: 'anvil',
            transport: http(`http://${anvil.host}:${anvil.port}`),
        });
        networkConfigs[-1] = new BlockchainConfig(
            polygonMumbai,
            `http://${anvil.host}:${anvil.port}`,
            10000
        );
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterAll(async () => {
        await anvil?.stop();
    });

    it('test node', async () => {
        const { config, client } = getNetworkConfigAndClient(-1);
        console.log(testClient, client);
        console.log(
            'Current block',
            await client.getBlockNumber({ maxAge: 0 })
        );
        await testClient.mine({ blocks: 1 });
        console.log(
            'Mined one block',
            await client.getBlockNumber({ maxAge: 0 })
        );
    });
});
