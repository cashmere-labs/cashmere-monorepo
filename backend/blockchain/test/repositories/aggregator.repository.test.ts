import {
    continueSwapFunctionABI,
    getNetworkConfigAndClient,
    startSwapFunctionABI,
} from '@cashmere-monorepo/shared-blockchain';
import { faker } from '@faker-js/faker';
import { GetFunctionArgs, Hash, encodeFunctionData } from 'viem';
import { beforeAll, describe, expect, it } from 'vitest';
import { AggregatorRepository, getAggregatorRepository } from '../../src';
import { TEST_CHAIN_ID, testAccount, testClient } from '../_setup';

describe('[Backend][Blockchain] Aggregator repository', async () => {
    let aggregatorRepository: AggregatorRepository;

    beforeAll(async () => {
        aggregatorRepository = getAggregatorRepository(TEST_CHAIN_ID);
    });

    it('[Ok] Parses start swap args', async () => {
        // Create args
        const startSwapParams: GetFunctionArgs<
            [typeof startSwapFunctionABI],
            'startSwap'
        > = {
            args: [
                {
                    srcToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
                    srcAmount: 1n,
                    lwsPoolId: 2,
                    hgsPoolId: 3,
                    dstToken: '0x000000000000000000000000000000000000dEaD',
                    dstChain: 4,
                    dstAggregatorAddress:
                        '0xED1Cd77f427D716B9CA57fA7EC54A809372e4756',
                    minHgsAmount: 5n,
                    signature: '0xdeadbeef',
                },
            ],
        };
        // Send a transaction
        const tx = await testClient.sendUnsignedTransaction({
            from: testAccount.address,
            data: encodeFunctionData({
                abi: [startSwapFunctionABI],
                ...startSwapParams,
            }),
        });
        // And verify that it was retrieved and parsed correctly
        expect(await aggregatorRepository.getStartSwapArgs(tx)).toMatchObject({
            functionName: 'startSwap',
            ...startSwapParams,
        });
    });

    it('[Ok] Checks if address is aggregator', async () => {
        const { config } = getNetworkConfigAndClient(TEST_CHAIN_ID);
        expect(
            aggregatorRepository.isContractAddress(
                config.getContractAddress('aggregator')
            )
        ).toBe(true);
        expect(
            aggregatorRepository.isContractAddress(
                '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
            )
        ).toBe(false);
    });

    it('[Ok] Encodes continue swap function call data', async () => {
        const { config } = getNetworkConfigAndClient(TEST_CHAIN_ID);
        const params = {
            srcChainId: 42,
            id: faker.string.hexadecimal({ length: 64 }) as Hash,
        };
        expect(
            aggregatorRepository.encodeContinueSwapCallData(params)
        ).toMatchObject({
            target: config.getContractAddress('aggregator'),
            data: encodeFunctionData({
                abi: [continueSwapFunctionABI],
                args: [params],
            }),
        });
    });
});
