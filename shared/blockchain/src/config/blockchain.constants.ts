// Every deployed contract addresses
export const deployedContractAddresses: {
    [contract: string]: { [network: string]: string };
} = {
    usdcAsset: {
        mumbai: '0x6b4D20733f7bC0dd0082ACE1D2E5435B4fB50d31',
        goerli: '0x1a6584F3E5db8BcFD13BeB90a5f45192DCba23C9',
        lineaZk: '0x766a0c5948515E4Ce4147433c92D12467E03b590',
    },
    assetRouter: {
        mumbai: '0x8a889a9a1B3676c6dbb29Bf11C9F7e77c9996c51',
        goerli: '0x4cA8b1347dAA9C21c446e259CcFE3698D5619964',
        lineaZk: '0x9d3E6f6B7c8b8678F5C71967a19295657e49D24E',
    },
    bridge: {
        mumbai: '0x0c9a7819a6066b21915a05f72fbe09374b03110C',
        goerli: '0x5c1634623593Fb24e84eaF89eF6C7dB737E1cCba',
        lineaZk: '0xDE384cBED42A92484BD0E3be6fc5E8186a9F56F4',
    },
    feeHandler: {
        mumbai: '0x18Fc40e531c5779Dfd2610E1Dec7B9e2d106824e',
        goerli: '0x17B3767513bd65fF60D06e91C4AAFA842D9213BE',
        lineaZk: '0x7c20374Ab117C862d1e539769839e749401EA47A',
    },
    uniswapV2Router02: {
        mumbai: '0xe8399bcC8cA1308cE798C2c84eA41b4C5FB51704',
        goerli: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        'bsc-testnet': '0x0Fdf019338d4229A160011d0aA87485c756a24f0',
        'avalanche-fuji': '0x9F2bdc7c63D9CAD3Af1C5902d7fbCa297E0fc2Df',
        'ftm-testnet': '0xe8399bcC8cA1308cE798C2c84eA41b4C5FB51704',
        'arbitrum-goerli': '0x4325BB533E44c369ed9A154bDe923DF0Bbef129C',
        'optimistic-goerli': '0x6B15aC4FD227FD6e13f4f6410bDe6e4D2A359Eab',
        base: '0xe8399bcc8ca1308ce798c2c84ea41b4c5fb51704',
        polygonZk: '0x6Db6934861651c5109fF9B9b9A1bAa0b4243386e',
        lineaZk: '0x6C26792e2953A589C68B3b7f3705E9ceeB221834',
        metisGoerli: '0x8EdB69919835e98b5a4f751FAdB78d66C880475C',
    },
    uniswapV2Pair: {
        mumbai: '0xe234209ac7516f0FF3007b53182BA674e4D06299',
        goerli: '0xFA5Db19087920F5d0e71d0373F099bd0C03589DA',
        'bsc-testnet': '0xE23Ec4c9848f97FdE36e08D5cbE18657FB040EE8',
        'avalanche-fuji': '0xfc0957F6893245bd06A6F5554D0903Dcda4CfDb0',
        'ftm-testnet': '0x01692869555c76eD00071A0a51C81651AbE5A82e',
        'arbitrum-goerli': '0x8e3728E0549613Bb38f5c126f9BbE37b6bf9b429',
        'optimistic-goerli': '0x7C2c381Dd01B06252ea43f846150cb509b1F5149',
        base: '0xdfcb97A99DE8cf945a8EB107fF544a7dc252DEF5',
        polygonZk: '0xF33c1265DA58e474eccb34147C1AD17b334b60EF',
        lineaZk: '0x6b1380400b89f450598004452b40AB6e47c91082',
        metisGoerli: '0xBb12f429b4F97858c2Db4EdAD2DdCF2681126651',
    },
    nativeToken: {
        mumbai: '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889',
        goerli: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
        'bsc-testnet': '0x48f7D56c057F20668cdbaD0a9Cd6092B3dc83684',
        'avalanche-fuji': '0xd00ae08403B9bbb9124bB305C09058E32C39A48c',
        'ftm-testnet': '0x231401dC8b53338d78c08f83CC4EBc74148196d0',
        'arbitrum-goerli': '0xe39Ab88f8A4777030A534146A9Ca3B52bd5D43A3',
        'optimistic-goerli': '0x4200000000000000000000000000000000000006',
        base: '0x231401dC8b53338d78c08f83CC4EBc74148196d0',
        polygonZk: '0x2ad78787CCaf7FA8FAe8953FD78ab9163f81DcC8',
        lineaZk: '0xC5aB03962938Fa544D16F4667ED76788894fFca4',
        metisGoerli: '0x577dDC8c1bb948cdcF123Cd1f453Be80875Ec1F3',
    },
    usdc: {
        mumbai: '0x9f2bdc7c63d9cad3af1c5902d7fbca297e0fc2df',
        goerli: '0x9b2660a7becd0bf3d90401d1c214d2cd36317da5',
        'bsc-testnet': '0x4325BB533E44c369ed9A154bDe923DF0Bbef129C',
        'avalanche-fuji': '0x231401dC8b53338d78c08f83CC4EBc74148196d0',
        'ftm-testnet': '0x0Fdf019338d4229A160011d0aA87485c756a24f0',
        'arbitrum-goerli': '0x747E19a0A0D074598BB5FB758591bFF8dE517312',
        'optimistic-goerli': '0x12AAef2833E39d556d9D913574a8B021D8e954c0',
        base: '0x290B54A504A3b0cB21888e3E405AFC1b2946598C',
        polygonZk: '0x557278364B136a8D7686016b1930c8C7136d8af9',
        lineaZk: '0xF484ca938Af7165d0A8D99746939b1B60A26F0af',
        metisGoerli: '0xC5aB03962938Fa544D16F4667ED76788894fFca4',
    },
    l0Endpoint: {
        mumbai: '0xf69186dfBa60DdB133E91E9A4B5673624293d8F8',
        goerli: '0xbfD2135BFfbb0B5378b56643c2Df8a87552Bfa23',
        'bsc-testnet': '0x6Fcb97553D41516Cb228ac03FdC8B9a0a9df04A1',
        'avalanche-fuji': '0x93f54D755A063cE7bB9e6Ac47Eccc8e33411d706',
        'ftm-testnet': '0x7dcAD72640F835B0FA36EFD3D6d3ec902C7E5acf',
        'arbitrum-goerli': '0x6aB5Ae6822647046626e83ee6dB8187151E1d5ab',
        'optimistic-goerli': '0xae92d5aD7583AD66E49A0c67BAd18F6ba52dDDc1',
        base: '0x6aB5Ae6822647046626e83ee6dB8187151E1d5ab',
        polygonZk: '0x6aB5Ae6822647046626e83ee6dB8187151E1d5ab',
        lineaZk: '0x6aB5Ae6822647046626e83ee6dB8187151E1d5ab',
        metisGoerli: '0xae92d5aD7583AD66E49A0c67BAd18F6ba52dDDc1',
    },
    aggregator: {
        mumbai: '0x56Be7d0f660188dCe5AF76441676cB618543ACb8',
        goerli: '0x49A45933E21274b96090306B74D54CFBfae23CA6',
        lineaZk: '0x1F2131CeDa6E43FA8aD14956A0FCD3b447A51B28',
    },
    feeCollector: {
        mumbai: '0x0D237FC665D38db3ECF39a77dDeE884E9EBA16d2',
        goerli: '0xa08c5028f0891477601801f9f77B137965C652A3',
        'bsc-testnet': '0xCACdc977C08be3c83cFA785f716f923AD347f6Be',
        'avalanche-fuji': '0x351667975FC1e037910b3779ca7a8908f39eA2E4',
        'ftm-testnet': '0x213324cFEd10b2C3968416C7395c7c04e53ff5e9',
        'arbitrum-goerli': '0x92fa0dDCcbe8b2DdCCBa4f04e5a05a50Dfad17CC',
        'optimistic-goerli': '0x351667975FC1e037910b3779ca7a8908f39eA2E4',
        base: '0x351667975FC1e037910b3779ca7a8908f39eA2E4',
        polygonZk: '0x5fC78F745219FD451C03f4601c1b2216c2865A62',
        lineaZk: '0xe6D09CCd3B37E6466Cdd75B80152489078D4b151',
        metisGoerli: '0x299050683D2f8573b731E3025AA223DCC6abAD39',
    },
};

// New variable that list all the contract address per network
export const contractAddresses: {
    [network: string]: { [contract: string]: string };
} = Object.entries(deployedContractAddresses).reduce(
    (acc, [contract, addresses]) => {
        Object.entries(addresses).forEach(([network, address]) => {
            if (!acc[network]) acc[network] = {};

            acc[network]![contract] = address;
        });

        return acc;
    },
    {} as { [network: string]: { [contract: string]: string } }
);

// Match chain name to id's
const chainNameToIds = {
    'arbitrum-mainnet': 42161,
    avalanche: 43114,
    bsc: 56,
    'bsc-testnet': 97,
    hardhat: 31337,
    mainnet: 1,
    'optimism-mainnet': 10,
    polygon: 137,
    mumbai: 80001,
    rinkeby: 4,
    goerli: 5,
    'avalanche-fuji': 43113,
    'ftm-testnet': 4002,
    opera: 250,
    'arbitrum-goerli': 421613,
    'arbitrum-rinkeby': 421611,
    'optimistic-goerli': 420,
    base: 84531,
    lineaZk: 59140,
    polygonZk: 1442,
    // zkSyncTestnet: 280,
    metisGoerli: 599,
};
export const chainIdsToNames: { [chainId: number]: string } = Object.entries(
    chainNameToIds
).reduce((acc, [name, id]) => {
    if (acc[id]) {
        throw new Error(
            `Duplicate chain id ${id} for in ${acc[id]} and ${name}`
        );
    }
    acc[id] = name;

    return acc;
}, {} as { [chainId: number]: string });
