import {
    BlockchainConfig,
    chainIdsToNames,
    networkConfigs,
} from '@cashmere-monorepo/shared-blockchain';
import { Anvil, createAnvil } from '@viem/anvil';
import * as console from 'console';
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
import { privateKeyToAccount } from 'viem/accounts';
import { polygonMumbai } from 'viem/chains';
import { afterAll, afterEach, beforeAll } from 'vitest';

// Anvil instance
export let anvil: Anvil;
// Blockchain snapshot id
export let snapshotId: Hash;
// Client for test blockchain specific functions
export let testClient: TestClient;
// Normal chain client
export let anvilClient: PublicClient;
// Test account (private key from anvil)
export const testPrivateKey =
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
export let testAccount: Account;
// Test wallet
export let testWallet: WalletClient;
export const TEST_CHAIN_ID = 10050;

beforeAll(async () => {
    // Get config for polygon chain
    const polygonConfig = networkConfigs[polygonMumbai.id];
    // Start up Anvil
    anvil = createAnvil({
        forkUrl: polygonConfig.rpcUrl,
        forkBlockNumber: 36852846n,
        chainId: TEST_CHAIN_ID,
    });
    await anvil.start();

    // Create test chain definition
    const chain: Chain = {
        ...polygonMumbai,
        id: TEST_CHAIN_ID,
        name: 'Anvil',
        network: 'anvil',
    };

    // Create clients
    const transport = http(`http://${anvil.host}:${anvil.port}`);
    testClient = createTestClient({
        chain,
        mode: 'anvil',
        transport,
    });
    anvilClient = createPublicClient({
        chain,
        transport,
    });
    // Generate test account
    testAccount = privateKeyToAccount(testPrivateKey);
    console.log(`Test account address: ${testAccount.address}`);
    testWallet = createWalletClient({
        account: testAccount,
        chain,
        transport,
    });

    // Add test chain to network configs
    chainIdsToNames[TEST_CHAIN_ID] = 'mumbai';
    networkConfigs[TEST_CHAIN_ID] = new BlockchainConfig(
        chain,
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
