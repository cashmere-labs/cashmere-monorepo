import { Address, isAddressEqual } from 'viem';
import { getBlockchainService } from '../blockchain';
import { BlockchainInterface } from '../blockchain.service';
import { isPlaceholderToken } from '../utils';

export const getAllSwapParamsDatas = async (
  srcChainId: number,
  srcToken: Address,
  dstChainId: number,
  dstToken: Address,
): Promise<{
  srcToken: Address;
  dstToken: Address;
  srcNetwork: BlockchainInterface;
  dstNetwork: BlockchainInterface;
  lwsAssetId: string;
  hgsAssetId: string;
  lwsToken: Address;
  hgsToken: Address;
  needSrcSwap: boolean;
  needDstSwap: boolean;
}> => {
  const blockchainService = getBlockchainService();
  const srcNetwork = blockchainService.getForChain(srcChainId);
  const dstNetwork = blockchainService.getForChain(dstChainId);
  const srcContracts = srcNetwork.contracts;
  const dstContracts = dstNetwork.contracts;

  if (isPlaceholderToken(srcToken))
    {srcToken = srcNetwork.config.getContractAddress('nativeToken');}

  if (isPlaceholderToken(dstToken))
    {dstToken = dstNetwork.config.getContractAddress('nativeToken');}

  const lwsAssetId = '1';
  const hgsAssetId = '1';
  const [lwsToken, hgsToken] = await Promise.all([
    srcContracts.assetContractTokenFromPoolId(parseInt(lwsAssetId)),
    dstContracts.assetContractTokenFromPoolId(parseInt(hgsAssetId)),
  ]);

  return {
    srcToken,
    dstToken,
    srcNetwork,
    dstNetwork,
    lwsAssetId,
    hgsAssetId,
    lwsToken,
    hgsToken,
    needSrcSwap: !isAddressEqual(srcToken, lwsToken),
    needDstSwap: !isAddressEqual(hgsToken, dstToken),
  };
};
