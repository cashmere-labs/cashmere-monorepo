import { parseEther } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { bscTestnet, polygonMumbai, polygonZkEvmTestnet } from 'viem/chains';
import { beforeAll, describe, expect, it } from 'vitest';
import {
    BlockchainRepository,
    NATIVE_PLACEHOLDER,
    getBlockchainRepository,
    networkConfigs,
} from '../../src';
import { TEST_CHAIN_ID, anvilClient, testAccount, testClient } from '../_setup';

describe('[Backend][Blockchain] Blockchain repository', () => {
    let blockchainRepository: BlockchainRepository;

    beforeAll(async () => {
        blockchainRepository = getBlockchainRepository(TEST_CHAIN_ID);
    });

    it('[Ok] Builds a private client', async () => {
        const pk = generatePrivateKey();
        const { account, privateClient } =
            blockchainRepository.buildPrivateClient(pk);
        expect(account.address).toEqual(privateKeyToAccount(pk).address);
        expect(privateClient.account.address).toEqual(account.address);
    });

    it('[Ok] Gets the last block number', async () => {
        const blockNumber = await anvilClient.getBlockNumber();
        expect(await blockchainRepository.getLastBlockNumber()).oneOf([
            blockNumber,
            `${blockNumber}`,
        ]);
    });

    it('[Ok] Gets maxed out scan block', async () => {
        expect(
            blockchainRepository.getMaxedOutScanToBlock({
                from: 100n,
                to: 200n,
            }).maxBlock
        ).toEqual(200n);
        networkConfigs[TEST_CHAIN_ID].scanConfig.maxScanBlock = 10;
        expect(
            blockchainRepository.getMaxedOutScanToBlock({
                from: 100n,
                to: 200n,
            }).maxBlock
        ).toEqual(110n);
        networkConfigs[TEST_CHAIN_ID].scanConfig.maxScanBlock = undefined;
    });

    it('[Ok] Gets transaction receipt', async () => {
        const hash = await testClient.sendUnsignedTransaction({
            from: testAccount.address,
            to: NATIVE_PLACEHOLDER,
            value: parseEther('1'),
        });
        await testClient.mine({ blocks: 1 });
        expect(
            await blockchainRepository.getTransactionReceipt(hash)
        ).toMatchObject(await anvilClient.getTransactionReceipt({ hash }));
    });

    it('[Ok] Gets gas fees params', async () => {
        let blockchainRepository = getBlockchainRepository(polygonMumbai.id);
        expect(await blockchainRepository.getGasFeesParam()).keys([
            'maxPriorityFeePerGas',
            'maxFeePerGas',
            'gasLimit',
        ]);
        blockchainRepository = getBlockchainRepository(bscTestnet.id);
        expect(await blockchainRepository.getGasFeesParam()).keys([
            'gasPrice',
            'gasLimit',
        ]);
        blockchainRepository = getBlockchainRepository(polygonZkEvmTestnet.id);
        expect(await blockchainRepository.getGasFeesParam()).keys(['gasLimit']);
    });
});
