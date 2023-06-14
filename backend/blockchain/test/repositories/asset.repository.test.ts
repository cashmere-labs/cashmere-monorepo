import { compileSourceString } from 'solc-typed-ast';
import { Address, encodeDeployData } from 'viem';
import { beforeEach, describe, expect, it } from 'vitest';
import {
    AssetRepository,
    NATIVE_PLACEHOLDER,
    getAssetRepository,
} from '../../src';
import {
    TEST_CHAIN_ID,
    anvilClient,
    testAccount,
    testChain,
    testClient,
} from '../_setup';

describe('[Backend][Blockchain] Asset repository', () => {
    let erc20: Address;
    let assetRepository: AssetRepository;

    beforeEach(async () => {
        // Compile the mock contract
        const compiled = await compileSourceString(
            'erc20.sol',
            `
            pragma solidity ^0.8.0;
            contract ERC20 {
                uint256 public constant decimals = 9;
                string public constant symbol = "TEST"; 
            }
        `,
            'auto'
        );
        // Deploy it
        const hash = await testClient.sendUnsignedTransaction({
            from: testAccount.address,
            data: encodeDeployData({
                abi: [],
                bytecode:
                    compiled.data.contracts['erc20.sol'].ERC20.evm.bytecode
                        .object,
            }),
        });
        await testClient.mine({ blocks: 1 });
        // And get its address
        erc20 = (await anvilClient.getTransactionReceipt({ hash }))
            .contractAddress!;

        // Create the repository
        assetRepository = getAssetRepository(TEST_CHAIN_ID);
    });

    it('[Ok] Gets decimals from a token', async () => {
        // Check that the decimals are correct
        expect(await assetRepository.tokenDecimal(erc20)).toEqual(9);
        // Check that the decimals are correct for native currency
        expect(await assetRepository.tokenDecimal(NATIVE_PLACEHOLDER)).toEqual(
            testChain.nativeCurrency.decimals
        );
    });

    it('[Ok] Gets symbol from a token', async () => {
        // Check that the symbol is correct
        expect(await assetRepository.tokenSymbol(erc20)).toEqual('TEST');
        // Check that the symbol is correct for native currency
        expect(await assetRepository.tokenSymbol(NATIVE_PLACEHOLDER)).toEqual(
            testChain.nativeCurrency.symbol
        );
    });
});
