import { erc20ABI } from '@cashmere-monorepo/shared-blockchain';
import { list } from 'radash';
import { encodeFunctionData, getAddress, parseEther } from 'viem';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { GasParam, getMultiCallRepository } from '../../src';
import {
    MultiCallFunctionData,
    MultiCallRepository,
} from '../../src/repositories/multicall.repository';
import {
    TEST_CHAIN_ID,
    TEST_CHAIN_ID_EMPTY_CONFIG,
    testPrivateKey,
} from '../_setup';

describe('[Backend][Blockchain] Multicall repository', async () => {
    let multiCallRepository: MultiCallRepository;
    let gasParam: GasParam;

    beforeAll(async () => {
        // Mock the private key
        vi.stubEnv('PRIVATE_KEY', testPrivateKey);
        // Get our repository
        multiCallRepository = getMultiCallRepository(TEST_CHAIN_ID);
        // Anvil gas param
        gasParam = {
            gasLimit: 30000000n,
        };
    });

    it('[Ok] Should be able to send single tx', async () => {
        // Build a simple call tx data
        const functionData = encodeFunctionData({
            abi: erc20ABI,
            functionName: 'approve',
            args: [
                getAddress('0x7caF754C934710D7C73bc453654552BEcA38223F'),
                parseEther('1'),
            ],
        });

        const callData: MultiCallFunctionData = {
            target: getAddress('0xbCeE0E1C02E91EAFaEd69eD2B1DC5199789575df'),
            data: functionData,
        };

        // Simple write test
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

    it('[Ok] Should be able to send multiple tx', async () => {
        // Build a simple call tx data
        const functionData = encodeFunctionData({
            abi: erc20ABI,
            functionName: 'approve',
            args: [
                getAddress('0x7caF754C934710D7C73bc453654552BEcA38223F'),
                parseEther('1'),
            ],
        });

        const callDatas: MultiCallFunctionData[] = list(100).map(() => ({
            target: getAddress('0xbCeE0E1C02E91EAFaEd69eD2B1DC5199789575df'),
            data: functionData,
        }));

        // Multiple write test
        const response = await multiCallRepository.sendBatchedTx(
            callDatas,
            gasParam,
            false
        );
        expect(response).toBeDefined();
        expect(response).toHaveProperty('txHash');
        expect(response).toHaveProperty('successIdx');
        expect(response).toHaveProperty('failedIdx');
        expect(response.successIdx.length).toBe(101);
        expect(response.failedIdx.length).toBe(0);
    });

    it('[Ok] Should be able to handle a single failing tx', async () => {
        // Build a simple call tx data
        const functionData = encodeFunctionData({
            abi: erc20ABI,
            functionName: 'transfer',
            args: [
                getAddress('0x7caF754C934710D7C73bc453654552BEcA38223F'),
                parseEther('10'),
            ],
        });

        const callData: MultiCallFunctionData = {
            target: getAddress('0xbCeE0E1C02E91EAFaEd69eD2B1DC5199789575df'),
            data: functionData,
        };

        // Multiple write test
        const response = await multiCallRepository.sendBatchedTx(
            [callData],
            gasParam,
            false
        );
        expect(response).toBeDefined();
        expect(response).toHaveProperty('successIdx');
        expect(response).toHaveProperty('failedIdx');
        expect(response.successIdx.length).toBe(0);
        expect(response.failedIdx.length).toBe(1);
    });

    it('[Ok] Should be able to handle a failing inside multiple tx', async () => {
        // Build a simple call tx data
        const approveFunctionData = encodeFunctionData({
            abi: erc20ABI,
            functionName: 'approve',
            args: [
                getAddress('0x7caF754C934710D7C73bc453654552BEcA38223F'),
                parseEther('1'),
            ],
        });
        const failingFunctionData = encodeFunctionData({
            abi: erc20ABI,
            functionName: 'transfer',
            args: [
                getAddress('0x7caF754C934710D7C73bc453654552BEcA38223F'),
                parseEther('10'),
            ],
        });

        const callDatas: MultiCallFunctionData[] = [
            approveFunctionData,
            failingFunctionData,
        ].map((data) => ({
            target: getAddress('0xbCeE0E1C02E91EAFaEd69eD2B1DC5199789575df'),
            data,
        }));

        // Multiple write test
        const response = await multiCallRepository.sendBatchedTx(
            callDatas,
            gasParam,
            false
        );
        expect(response).toBeDefined();
        expect(response).toHaveProperty('txHash');
        expect(response).toHaveProperty('successIdx');
        expect(response).toHaveProperty('failedIdx');
        expect(response.successIdx.length).toBe(1);
        expect(response.successIdx[0]).toBe(0);
        expect(response.failedIdx.length).toBe(1);
        expect(response.failedIdx[0]).toBe(1);
    });

    it('[Ok] Should allow the tx to fail param passed', async () => {
        // Build a simple call tx data
        const functionData = encodeFunctionData({
            abi: erc20ABI,
            functionName: 'transfer',
            args: [
                getAddress('0x7caF754C934710D7C73bc453654552BEcA38223F'),
                parseEther('10'),
            ],
        });

        const callData: MultiCallFunctionData = {
            target: getAddress('0xbCeE0E1C02E91EAFaEd69eD2B1DC5199789575df'),
            data: functionData,
        };

        // Multiple write test
        const response = await multiCallRepository.sendBatchedTx(
            [callData],
            gasParam,
            true
        );
        expect(response).toBeDefined();
        expect(response).toHaveProperty('successIdx');
        expect(response).toHaveProperty('failedIdx');
        expect(response.successIdx.length).toBe(1);
        expect(response.failedIdx.length).toBe(0);
    });

    it('[Ok] Should allow multiple tx to fail', async () => {
        // Build a simple call tx data
        const approveFunctionData = encodeFunctionData({
            abi: erc20ABI,
            functionName: 'approve',
            args: [
                getAddress('0x7caF754C934710D7C73bc453654552BEcA38223F'),
                parseEther('1'),
            ],
        });
        const failingFunctionData = encodeFunctionData({
            abi: erc20ABI,
            functionName: 'transfer',
            args: [
                getAddress('0x7caF754C934710D7C73bc453654552BEcA38223F'),
                parseEther('10'),
            ],
        });

        const callDatas: MultiCallFunctionData[] = [
            approveFunctionData,
            failingFunctionData,
        ].map((data) => ({
            target: getAddress('0xbCeE0E1C02E91EAFaEd69eD2B1DC5199789575df'),
            data,
        }));

        // Multiple write test
        const response = await multiCallRepository.sendBatchedTx(
            callDatas,
            gasParam,
            true
        );
        expect(response).toBeDefined();
        expect(response).toHaveProperty('txHash');
        expect(response).toHaveProperty('successIdx');
        expect(response).toHaveProperty('failedIdx');
        expect(response.successIdx.length).toBe(2);
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

    it('[Fail] Should not init if no multicall address present in the config', async () => {
        // And verify that it was retrieved and parsed correctly
        expect(() =>
            getMultiCallRepository(TEST_CHAIN_ID_EMPTY_CONFIG)
        ).toThrowError();
    });
});
