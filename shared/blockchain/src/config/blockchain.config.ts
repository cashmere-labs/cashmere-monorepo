import {
    Address,
    Chain,
    createPublicClient,
    getAddress,
    http,
    HttpTransport,
    PublicClient,
    webSocket,
    WebSocketTransport,
} from 'viem';
import {
    arbitrumGoerli,
    avalancheFuji,
    baseGoerli,
    bscTestnet,
    fantomTestnet,
    goerli,
    metisGoerli,
    optimismGoerli,
    polygonMumbai,
    polygonZkEvmTestnet,
} from 'viem/chains';

import { lineaZk } from '../chain/chain';
import {
    ARBITRUM_GOERLI_CHAIN_ID,
    AVALANCHE_FUJI_CHAIN_ID,
    BASE_GOERLI_CHAIN_ID,
    BSC_TESTNET_CHAIN_ID,
    FANTOM_TESTNET_CHAIN_ID,
    GOERLI_CHAIN_ID,
    LINEA_ZK_TESTNET_CHAIN_ID,
    METIS_GOERLI_CHAIN_ID,
    MUMBAI_CHAIN_ID,
    OPTIMISM_GOERLI_CHAIN_ID,
    POLYGON_ZK_TESTNET_CHAIN_ID,
} from '../chain/chain.constants';
import { chainIdsToNames, contractAddresses } from './blockchain.constants';

/**
 * Represent a network configuration
 */
export class BlockchainConfig {
    readonly addresses: { [contract: string]: string };

    constructor(
        public readonly chain: Chain,
        public readonly rpcUrl: string,
        public readonly l0ChainId: number,
        public readonly scanConfig: {
            maxScanBlock?: number;
            scanDelay?: number;
        } = { maxScanBlock: 2_000 } // Default recommended value on chainstack
    ) {
        // Find the address key for the chain
        const addressesKey = chainIdsToNames[chain.id];
        if (!addressesKey) {
            throw new Error(
                `Config error, unable to find address key for chain ${chain.id}`
            );
        }

        // Find all the contract addresses
        const contractAddress = contractAddresses[addressesKey];
        if (!contractAddress) {
            throw new Error(
                `Config error, unable to find the addresses key for chain ${chain.id}`
            );
        }

        this.addresses = contractAddress;
    }

    // Get the address of a contract
    getContractAddress(key: string): Address {
        const address = this.addresses[key];
        if (!address) {
            throw new Error(
                `Config error, unable to find address for key ${key} and chain ${this.chain.id}`
            );
        }

        return getAddress(address);
    }
}

/**
 * All the different config per chains
 * Check out here for max block limitation : https://support.chainstack.com/hc/en-us/articles/6955614349209-Node-and-connection-limitations#:~:text=The%20limitations%20are%20as%20follows,Harmony%20%E2%80%94%201%2C024%20blocks.
 */
export const networkConfigs: {
    [chainId: string]: BlockchainConfig;
} = {
    [MUMBAI_CHAIN_ID]: new BlockchainConfig(
        polygonMumbai,
        //'https://nd-205-910-430.p2pify.com/5e4fbcfe1a1af2bb2c6f5b0e9e538551',
        'https://ultra-wispy-season.matic-testnet.quiknode.pro/29108b7afd374f0c65eb9ce39476825c049bd0e8/',
        10109
    ),
    [GOERLI_CHAIN_ID]: new BlockchainConfig(
        goerli,
        // 'https://nd-186-519-127.p2pify.com/17f1fca4fe1e8dc55f77dfbcc05ccc7b',
        'https://few-long-seed.ethereum-goerli.quiknode.pro/b765f3dc49661b48dd40f0e272d7455ad2c15857/',
        10121
    ),
    [BSC_TESTNET_CHAIN_ID]: new BlockchainConfig(
        bscTestnet,
        'https://nd-982-104-569.p2pify.com/1166714fe3a4c30fb55695634c134102',
        10102
    ),
    [AVALANCHE_FUJI_CHAIN_ID]: new BlockchainConfig(
        avalancheFuji,
        'https://nd-846-924-870.p2pify.com/32a211f05d2760eba35fa37618da2f14/ext/bc/C/rpc',
        10106,
        { maxScanBlock: 10_000 } // Lower than the max to prevent memory overload on our side
    ),
    [FANTOM_TESTNET_CHAIN_ID]: new BlockchainConfig(
        fantomTestnet,
        'https://nd-994-420-936.p2pify.com/85c3578cdeead5b178d6179d89467d6b',
        10112,
        { maxScanBlock: 100 }
    ),
    [ARBITRUM_GOERLI_CHAIN_ID]: new BlockchainConfig(
        arbitrumGoerli,
        'https://nd-441-846-758.p2pify.com/114f826fa77fc433864d1a8c595c9797',
        10143
    ),
    [OPTIMISM_GOERLI_CHAIN_ID]: new BlockchainConfig(
        optimismGoerli,
        'https://opt-goerli.g.alchemy.com/v2/tXa8Otacz1x4z-uN9Ut2F_LjYnJeq1cE',
        10132
    ),
    [BASE_GOERLI_CHAIN_ID]: new BlockchainConfig(
        baseGoerli,
        'https://base-goerli.blastapi.io/b79c6fd6-a635-482a-b14e-9b414a643dfd',
        10160
    ),
    [LINEA_ZK_TESTNET_CHAIN_ID]: new BlockchainConfig(
        lineaZk,
        'https://consensys-zkevm-goerli-prealpha.infura.io/v3/a7819dae3e524fe88aaa9999c1128fbe',
        10157
    ),
    [POLYGON_ZK_TESTNET_CHAIN_ID]: new BlockchainConfig(
        polygonZkEvmTestnet,
        'https://nd-128-575-364.p2pify.com/d3d6013c9736474060b5eefc44d81660',
        10158
    ),
    [METIS_GOERLI_CHAIN_ID]: new BlockchainConfig(
        metisGoerli,
        'https://goerli.gateway.metisdevops.link',
        10151
    ),
    // [ETHEREUM_CHAIN_ID]: new BlockchainConfig(
    //   ETHEREUM_CHAIN_ID,
    //   'https://eth-mainnet.g.alchemy.com/v2/dcp_zwzQ14lWcfuLy3tGJxz1MV0VtRY4',
    //   '101',
    // ),
    // [POLYGON_CHAIN_ID]: new BlockchainConfig(
    //   POLYGON_CHAIN_ID,
    //   'https://polygon-mainnet.g.alchemy.com/v2/Zl98YtSpxqX-cifHCoZEWN7ncytcmVln',
    //   '109',
    // ),
    // [ARBITRUM_CHAIN_ID]: new BlockchainConfig(
    //   ARBITRUM_CHAIN_ID,
    //   'https://arb-mainnet.g.alchemy.com/v2/zpfIgef6IVAMeTcaS5v9PLZFp1aiGDi1',
    //   '110',
    // ),
    // [AVALANCHE_CHAIN_ID]: new BlockchainConfig(
    //   AVALANCHE_CHAIN_ID,
    //   'https://nd-560-802-739.p2pify.com/674eee0b0c80bc678c921340d997d035/ext/bc/C/rpc',
    //   '106',
    //   { maxScanBlock: 10_000 }  // Lower than the max to prevent memory overload on our side
    // ),
    // [BSC_CHAIN_ID]: new BlockchainConfig(
    //   BSC_CHAIN_ID,
    //   'https://nd-920-310-122.p2pify.com/2ec0aa8517fbb2563b494d7a22ceb61f',
    //   '102',
    // ),
    // [OPTIMISM_CHAIN_ID]: new BlockchainConfig(
    //   OPTIMISM_CHAIN_ID,
    //   'https://opt-mainnet.g.alchemy.com/v2/x6bH_tMmUpkTR5kaOQrWg8uITMZyhYeH',
    //   '111',
    // ),
    // [FANTOM_CHAIN_ID]: new BlockchainConfig(
    //   FANTOM_CHAIN_ID,
    //   'https://nd-761-590-257.p2pify.com/83919eaf32983485e28f2c166b329f20',
    //   '112',
    //   { maxScanBlock: 100 }
    // ),
};

// Get a network config by chain id
export const getNetworkConfig = (chainId: number): BlockchainConfig => {
    // Find the config
    if (!networkConfigs[chainId.toString()]) {
        throw new Error(`Config for chain id ${chainId} not found`);
    }

    return networkConfigs[chainId.toString()]!;
};

// Get a network config by chain id
export const getNetworkConfigAndClient = (
    chainId: number
): { config: BlockchainConfig; client: PublicClient } => {
    // Find the config
    const config = getNetworkConfig(chainId);
    // Build the transport for our client
    let transport: HttpTransport | WebSocketTransport;
    if (config.rpcUrl.startsWith('ws')) {
        transport = webSocket(config.rpcUrl, {
            retryCount: 5,
            retryDelay: 2_000,
        });
    } else {
        transport = http(config.rpcUrl, {
            retryCount: 5,
            retryDelay: 2_000,
            timeout: 30_000,
            fetchOptions: {
                priority: 'high',
            },
        });
    }

    const client = createPublicClient({
        chain: config.chain,
        transport,
    });

    return { config, client };
};

// Match L0 chain id to destination chain id
export const l0ChainIdToConfigMapViem: { [chainId: number]: number } = {};
Object.entries(networkConfigs).forEach(([chainId, network]) => {
    l0ChainIdToConfigMapViem[parseInt(network.l0ChainId)] = parseInt(chainId);
});
