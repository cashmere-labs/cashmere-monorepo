import { beforeAll, describe, it } from 'vitest';
import { getUniswapRepository } from '../../src';
import { UniswapRepository } from '../../src/repositories/uniswap.repository';
import { TEST_CHAIN_ID } from '../_setup';

describe('[Backend][Blockchain] Uniswap repository', () => {
    let uniswapRepository: UniswapRepository;

    beforeAll(() => {
        uniswapRepository = getUniswapRepository(TEST_CHAIN_ID);
    });

    it('[Ok] Quotes uniswap swap', async () => {
        // TODO
        // await uniswapRepository.getAmountOut({
        //     amount: parseEther('1'),
        //     fromToken: '0xd8f69e1F100Db655d4503545C3BB308CAab4a3B6',
        //     toToken: '0xae939fF4D13a2A280fAd74c0224949bf4ba573f0',
        // });
    });
});
