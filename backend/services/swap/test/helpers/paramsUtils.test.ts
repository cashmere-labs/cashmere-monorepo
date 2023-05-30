import {
    NATIVE_PLACEHOLDER,
    isPlaceholderToken,
} from '@cashmere-monorepo/backend-blockchain';
import { Address } from 'viem';
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('[Swap][Unit] Params utils', () => {
    // The tested function
    let getAllSwapParamsDatas: (
        srcChainId: number,
        srcToken: Address,
        dstChainId: number,
        dstToken: Address
    ) => Promise<{
        srcToken: Address;
        dstToken: Address;
        lwsAssetId: string;
        hgsAssetId: string;
        lwsToken: Address;
        hgsToken: Address;
        needSrcSwap: boolean;
        needDstSwap: boolean;
    }>;

    beforeAll(async () => {
        // Mock backend-blockchain
        vi.doMock('@cashmere-monorepo/backend-blockchain', () => ({
            getNetworkConfig: (chainId: number) => ({
                getContractAddress: () =>
                    `0x${chainId}826539Cbd8d68DCF119e80B994557B4278CeC9f`,
            }),
            getAssetRouterRepository: (chainId: number) => ({
                getPoolTokenAsset: async (assetId: number) =>
                    `0x${chainId}E30E7c24e4dFcb281A682562E53154C15D3332${assetId}`,
            }),
            isPlaceholderToken,
        }));
        // Import the tested function
        ({ getAllSwapParamsDatas } = await import(
            '../../src/helpers/paramsUtils'
        ));
    });

    it('[Ok] Generates swap params data normally', async () => {
        expect(
            await getAllSwapParamsDatas(
                1,
                '0x9029C772DDE847622DF1553eD9d9BDb7812e4f93',
                2,
                '0x455E5AA18469bC6ccEF49594645666C587A3a71B'
            )
        ).toEqual({
            dstToken: '0x455E5AA18469bC6ccEF49594645666C587A3a71B',
            hgsAssetId: '1',
            hgsToken: '0x2E30E7c24e4dFcb281A682562E53154C15D33321',
            lwsAssetId: '1',
            lwsToken: '0x1E30E7c24e4dFcb281A682562E53154C15D33321',
            needDstSwap: true,
            needSrcSwap: true,
            srcToken: '0x9029C772DDE847622DF1553eD9d9BDb7812e4f93',
        });
    });

    it('[Ok] Detects placeholder token address', async () => {
        // Use placeholder for srcToken
        expect(
            await getAllSwapParamsDatas(
                1,
                NATIVE_PLACEHOLDER,
                2,
                '0x455E5AA18469bC6ccEF49594645666C587A3a71B'
            )
        ).toEqual({
            dstToken: '0x455E5AA18469bC6ccEF49594645666C587A3a71B',
            hgsAssetId: '1',
            hgsToken: '0x2E30E7c24e4dFcb281A682562E53154C15D33321',
            lwsAssetId: '1',
            lwsToken: '0x1E30E7c24e4dFcb281A682562E53154C15D33321',
            needDstSwap: true,
            needSrcSwap: true,
            srcToken: '0x1826539Cbd8d68DCF119e80B994557B4278CeC9f', // special value for testing, with chain id prefix
        });

        // Use placeholder for dstToken
        expect(
            await getAllSwapParamsDatas(
                1,
                '0x9029C772DDE847622DF1553eD9d9BDb7812e4f93',
                2,
                NATIVE_PLACEHOLDER
            )
        ).toEqual({
            dstToken: '0x2826539Cbd8d68DCF119e80B994557B4278CeC9f', // special value for testing, with chain id prefix
            hgsAssetId: '1',
            hgsToken: '0x2E30E7c24e4dFcb281A682562E53154C15D33321',
            lwsAssetId: '1',
            lwsToken: '0x1E30E7c24e4dFcb281A682562E53154C15D33321',
            needDstSwap: true,
            needSrcSwap: true,
            srcToken: '0x9029C772DDE847622DF1553eD9d9BDb7812e4f93',
        });

        // Use placeholder for both srcToken and dstToken
        expect(
            await getAllSwapParamsDatas(
                1,
                NATIVE_PLACEHOLDER,
                2,
                NATIVE_PLACEHOLDER
            )
        ).toEqual({
            dstToken: '0x2826539Cbd8d68DCF119e80B994557B4278CeC9f', // special value for testing, with chain id prefix
            hgsAssetId: '1',
            hgsToken: '0x2E30E7c24e4dFcb281A682562E53154C15D33321',
            lwsAssetId: '1',
            lwsToken: '0x1E30E7c24e4dFcb281A682562E53154C15D33321',
            needDstSwap: true,
            needSrcSwap: true,
            srcToken: '0x1826539Cbd8d68DCF119e80B994557B4278CeC9f', // special value for testing, with chain id prefix
        });
    });

    it('[Ok] Returns correct needSrcSwap and needDstSwap', async () => {
        // Use srcToken = lwsToken
        expect(
            await getAllSwapParamsDatas(
                1,
                '0x1E30E7c24e4dFcb281A682562E53154C15D33321',
                2,
                '0x455E5AA18469bC6ccEF49594645666C587A3a71B'
            )
        ).toEqual({
            dstToken: '0x455E5AA18469bC6ccEF49594645666C587A3a71B',
            hgsAssetId: '1',
            hgsToken: '0x2E30E7c24e4dFcb281A682562E53154C15D33321',
            lwsAssetId: '1',
            lwsToken: '0x1E30E7c24e4dFcb281A682562E53154C15D33321',
            needDstSwap: true,
            needSrcSwap: false,
            srcToken: '0x1E30E7c24e4dFcb281A682562E53154C15D33321',
        });

        // Use dstToken = hgsToken
        expect(
            await getAllSwapParamsDatas(
                1,
                '0x9029C772DDE847622DF1553eD9d9BDb7812e4f93',
                2,
                '0x2E30E7c24e4dFcb281A682562E53154C15D33321'
            )
        ).toEqual({
            dstToken: '0x2E30E7c24e4dFcb281A682562E53154C15D33321',
            hgsAssetId: '1',
            hgsToken: '0x2E30E7c24e4dFcb281A682562E53154C15D33321',
            lwsAssetId: '1',
            lwsToken: '0x1E30E7c24e4dFcb281A682562E53154C15D33321',
            needDstSwap: false,
            needSrcSwap: true,
            srcToken: '0x9029C772DDE847622DF1553eD9d9BDb7812e4f93',
        });

        // Use both srcToken = lwsToken and dstToken = hgsToken
        expect(
            await getAllSwapParamsDatas(
                1,
                '0x1E30E7c24e4dFcb281A682562E53154C15D33321',
                2,
                '0x2E30E7c24e4dFcb281A682562E53154C15D33321'
            )
        ).toEqual({
            dstToken: '0x2E30E7c24e4dFcb281A682562E53154C15D33321',
            hgsAssetId: '1',
            hgsToken: '0x2E30E7c24e4dFcb281A682562E53154C15D33321',
            lwsAssetId: '1',
            lwsToken: '0x1E30E7c24e4dFcb281A682562E53154C15D33321',
            needDstSwap: false,
            needSrcSwap: false,
            srcToken: '0x1E30E7c24e4dFcb281A682562E53154C15D33321',
        });
    });
});
