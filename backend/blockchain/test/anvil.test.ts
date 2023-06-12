import {
    BlockchainConfig,
    getNetworkConfigAndClient,
    networkConfigs,
} from '@cashmere-monorepo/shared-blockchain';
import { Anvil, createAnvil } from '@viem/anvil';
import { TestClient, createTestClient, http } from 'viem';
import { polygonMumbai } from 'viem/chains';
import {
    afterAll,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

describe('[Backend][Blockchain] Anvil check', async () => {
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

    it('test block mining', async () => {
        const { client } = getNetworkConfigAndClient(-1);
        const currentBlock = await client.getBlockNumber({ maxAge: 0 });
        await testClient.mine({ blocks: 1 });
        expect(await client.getBlockNumber({ maxAge: 0 })).toEqual(
            currentBlock + 1n
        );
    });
});
