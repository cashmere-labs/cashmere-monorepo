import { PoolData } from '../../../types/app';
import { useToken } from 'wagmi';
import { Spinner } from '../../../ui';
import { formatBalance } from '../../../utils/formatBalance';

export const StakedLP  = ({ pool }: { pool?: PoolData }) => {
    // const { data, isLoading } = useContractRead({
    //     chainId: pool?.network,
    //     address: pool?.assetAddress,
    //     abi: AssetABI,
    //     functionName: 'totalSupply',
    //     args: [],
    // });

    // const { data: token } = useToken({
    //     chainId: pool?.network,
    //     address: pool?.tokenAddress,
    // });
    const { data: asset, isLoading } = useToken({
        chainId: pool?.network,
        address: pool?.assetAddress,
    });

    if (!isLoading)
        return <>${formatBalance(asset?.totalSupply.value, 4, asset?.decimals)}</>;
    return <Spinner />;
};
