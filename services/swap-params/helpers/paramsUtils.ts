import {
  Address,
  getAssetRouterRepository,
  getNetworkConfig,
  isAddressEqual,
  isPlaceholderToken,
} from '@cashmere-monorepo/blockchain';

// Get the formatted swap params data's
export const getAllSwapParamsDatas = async (
  srcChainId: number,
  srcToken: Address,
  dstChainId: number,
  dstToken: Address,
): Promise<{
  srcToken: Address;
  dstToken: Address;
  lwsAssetId: string;
  hgsAssetId: string;
  lwsToken: Address;
  hgsToken: Address;
  needSrcSwap: boolean;
  needDstSwap: boolean;
}> => {
  if (isPlaceholderToken(srcToken)) {
    srcToken = getNetworkConfig(srcChainId).getContractAddress('nativeToken');
  }

  if (isPlaceholderToken(dstToken)) {
    dstToken = getNetworkConfig(dstChainId).getContractAddress('nativeToken');
  }

  const lwsAssetId = '1';
  const hgsAssetId = '1';
  const [lwsToken, hgsToken] = await Promise.all([
    getAssetRouterRepository(srcChainId).getPoolTokenAsset(
      parseInt(lwsAssetId),
    ),
    getAssetRouterRepository(dstChainId).getPoolTokenAsset(
      parseInt(hgsAssetId),
    ),
  ]);

  return {
    srcToken,
    dstToken,
    lwsAssetId,
    hgsAssetId,
    lwsToken,
    hgsToken,
    needSrcSwap: !isAddressEqual(srcToken, lwsToken),
    needDstSwap: !isAddressEqual(hgsToken, dstToken),
  };
};
