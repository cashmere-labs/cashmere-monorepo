import {
    BlockchainConfig,
    chainIdsToNames,
    networkConfigs,
} from '@cashmere-monorepo/shared-blockchain';
import { Anvil, createAnvil } from '@viem/anvil';
import {
    Account,
    Chain,
    Hash,
    PublicClient,
    TestClient,
    WalletClient,
    createPublicClient,
    createTestClient,
    createWalletClient,
    http,
    parseEther,
} from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { polygonMumbai } from 'viem/chains';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

vi.mock('@cashmere-monorepo/backend-core', async () => {
    const BackendCore = (await vi.importActual(
        '@cashmere-monorepo/backend-core'
    )) as any;
    return {
        ...BackendCore,
        getOrSetFromCache: (_: any, fn: () => any) => fn(),
    };
});

// Anvil instance
export let anvil: Anvil;
// Blockchain snapshot id
export let snapshotId: Hash;
// Client for test blockchain specific functions
export let testClient: TestClient;
// Normal chain client
export let anvilClient: PublicClient;
// Test account
export let testAccount: Account;
// Test wallet
export let testWallet: WalletClient;
export const TEST_CHAIN_ID = 10050;
// Chain definition
export const testChain: Chain = {
    id: TEST_CHAIN_ID,
    name: 'Anvil',
    network: 'anvil',
    nativeCurrency: { ...polygonMumbai.nativeCurrency },
    rpcUrls: { ...polygonMumbai.rpcUrls },
};

beforeAll(async () => {
    // Get config for polygon chain
    const polygonConfig = networkConfigs[polygonMumbai.id];
    // Start up Anvil
    anvil = createAnvil({
        forkUrl: polygonConfig.rpcUrl,
        chainId: TEST_CHAIN_ID,
    });
    await anvil.start();

    // Create clients
    const transport = http(`http://${anvil.host}:${anvil.port}`);
    testClient = createTestClient({
        chain: testChain,
        mode: 'anvil',
        transport,
    });
    anvilClient = createPublicClient({
        chain: testChain,
        transport,
    });
    // Generate test account
    testAccount = privateKeyToAccount(generatePrivateKey());
    testWallet = createWalletClient({
        account: testAccount,
        chain: testChain,
        transport,
    });

    // Add test chain to network configs
    chainIdsToNames[TEST_CHAIN_ID] = 'mumbai';
    networkConfigs[TEST_CHAIN_ID] = new BlockchainConfig(
        testChain,
        `http://${anvil.host}:${anvil.port}`,
        10000
    );

    // Set test account balance
    await testClient.setBalance({
        address: testAccount.address,
        value: parseEther('10000'),
    });

    // Create snapshot
    snapshotId = await testClient.snapshot();
});

afterEach(async () => {
    // Revert to snapshot after each test unit
    await testClient.revert({ id: snapshotId });
});

afterAll(async () => {
    // Stop Anvil after all tests
    await anvil?.stop();
});
