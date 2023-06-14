import { erc20ABI } from '@cashmere-monorepo/shared-blockchain';
import { encodeFunctionData, getAddress } from 'viem';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
    GasParam,
    getBlockchainRepository,
    getMultiCallRepository,
} from '../../src';
import {
    MultiCallFunctionData,
    MultiCallRepository,
} from '../../src/repositories/multicall.repository';
import { TEST_CHAIN_ID, testPrivateKey } from '../_setup';

describe.only('[Backend][Blockchain] Multicall repository', async () => {
    let multiCallRepository: MultiCallRepository;
    let gasParam: GasParam;

    beforeAll(async () => {
        // Mock the private key
        vi.stubEnv('PRIVATE_KEY', testPrivateKey);
        // Get our repository
        multiCallRepository = getMultiCallRepository(TEST_CHAIN_ID);
        // Get current gas param
        const blockchainRepository = getBlockchainRepository(TEST_CHAIN_ID);
        gasParam = await blockchainRepository.getGasFeesParam();
    });

    it.only('[Ok] Should be able to send single tx', async () => {
        // Build a simple call tx data
        const functionData = encodeFunctionData({
            abi: erc20ABI,
            functionName: 'symbol',
        });

        const callData: MultiCallFunctionData = {
            target: getAddress('0xbCeE0E1C02E91EAFaEd69eD2B1DC5199789575df'),
            data: functionData,
        };

        const response = await multiCallRepository.sendBatchedTx(
            [callData],
            gasParam,
            false
        );
        expect(response).toBeDefined();
        expect(response).toHaveProperty('txHash');
        expect(response).toHaveProperty('successIdx');
        expect(response).toHaveProperty('failedIdx');
        expect(response.successIdx.length).toBe(1);
        expect(response.successIdx[0]).toBe(0);
        expect(response.failedIdx.length).toBe(0);
    });

    it('[Fail] Should fail if no call data provided', async () => {
        // And verify that it was retrieved and parsed correctly
        await expect(
            multiCallRepository.sendBatchedTx([], gasParam, false)
        ).rejects.toThrowError(
            'Unable to send batched tx, no call data provided'
        );
    });
});
