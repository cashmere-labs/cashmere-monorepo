import { defineChain } from 'viem';

/**
 * Custom chain for linea zk since not present yet in wagmi chains
 */
const lineaTestnet = {
    id: 59140,
    name: 'Linea Testnet',
    network: 'linea-testnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
        default: {
            http: ['https://rpc.goerli.linea.build'],
            webSocket: ['wss://rpc.goerli.linea.build'],
        },
        public: {
            http: ['https://rpc.goerli.linea.build'],
            webSocket: ['wss://rpc.goerli.linea.build'],
        },
    },
    blockExplorers: {
        default: {
            name: 'BlockScout',
            url: 'https://explorer.goerli.linea.build',
        },
    },
    contracts: {
        multicall3: {
            address: '0xcA11bde05977b3631167028862bE2a173976CA11',
            blockCreated: 498623,
        },
    },
    testnet: true,
} as const;

export const lineaZk = defineChain(lineaTestnet);
