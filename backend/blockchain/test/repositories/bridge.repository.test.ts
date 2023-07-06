import { goerli } from 'viem/chains';
import { beforeAll, describe, expect, it } from 'vitest';
import { getL0ChainFromChainId } from '../../src';
import {
    BridgeRepository,
    getBridgeRepository,
} from '../../src/repositories/bridge.repository';
import { TEST_CHAIN_ID } from '../_setup';

describe('[Backend][Blockchain] Bridge repository', () => {
    let bridgeRepository: BridgeRepository;

    beforeAll(() => {
        bridgeRepository = getBridgeRepository(TEST_CHAIN_ID);
    });

    it('[Ok] Gets l0 fee', async () => {
        expect(
            await bridgeRepository.getSwapFeeL0(
                getL0ChainFromChainId(goerli.id)
            )
        ).toBeGreaterThan(0n);
    }, 10000);

    it('[Ok] Gets SwapMessageReceived events', async () => {
        expect(
            await bridgeRepository.getSwapMessageReceivedEvents({
                fromBlock: 0n,
                toBlock: 100000n,
            })
        ).toHaveLength(0);
    });
});
