export const ETHEREUM_CHAIN_ID = '1';
export const POLYGON_CHAIN_ID = '137';
export const ARBITRUM_CHAIN_ID = '42161';
export const AVALANCHE_CHAIN_ID = '43114';
export const BSC_CHAIN_ID = '56';
export const OPTIMISM_CHAIN_ID = '10';
export const FANTOM_CHAIN_ID = '250';
// testnets
export const GOERLI_CHAIN_ID = '5';
export const MUMBAI_CHAIN_ID = '80001';
export const BSC_TESTNET_CHAIN_ID = '97';
export const AVALANCHE_FUJI_CHAIN_ID = '43113';
export const FANTOM_TESTNET_CHAIN_ID = '4002';
export const ARBITRUM_GOERLI_CHAIN_ID = '421613';
export const OPTIMISM_GOERLI_CHAIN_ID = '420';
export const BASE_GOERLI_CHAIN_ID = '84531';
export const POLYGON_ZK_TESTNET_CHAIN_ID = '1442';
export const LINEA_ZK_TESTNET_CHAIN_ID = '59140'; // Not in viem yet
export const METIS_GOERLI_CHAIN_ID = '599';

export type ChainID =
    | typeof ETHEREUM_CHAIN_ID
    | typeof POLYGON_CHAIN_ID
    | typeof ARBITRUM_CHAIN_ID
    | typeof AVALANCHE_CHAIN_ID
    | typeof BSC_CHAIN_ID
    | typeof OPTIMISM_CHAIN_ID
    | typeof FANTOM_CHAIN_ID
    // testnets
    | typeof GOERLI_CHAIN_ID
    | typeof MUMBAI_CHAIN_ID
    | typeof BSC_TESTNET_CHAIN_ID
    | typeof AVALANCHE_FUJI_CHAIN_ID
    | typeof FANTOM_TESTNET_CHAIN_ID
    | typeof ARBITRUM_GOERLI_CHAIN_ID
    | typeof OPTIMISM_GOERLI_CHAIN_ID
    | typeof BASE_GOERLI_CHAIN_ID
    | typeof POLYGON_ZK_TESTNET_CHAIN_ID
    | typeof LINEA_ZK_TESTNET_CHAIN_ID
    | typeof METIS_GOERLI_CHAIN_ID;

export const CHAIN_IDS = [
    // ETHEREUM_CHAIN_ID,
    // POLYGON_CHAIN_ID,
    // ARBITRUM_CHAIN_ID,
    // AVALANCHE_CHAIN_ID,
    // BSC_CHAIN_ID,
    // OPTIMISM_CHAIN_ID,
    // FANTOM_CHAIN_ID,
    // testnets
    GOERLI_CHAIN_ID,
    MUMBAI_CHAIN_ID,
    // BSC_TESTNET_CHAIN_ID,
    // AVALANCHE_FUJI_CHAIN_ID,
    // FANTOM_TESTNET_CHAIN_ID,
    // ARBITRUM_GOERLI_CHAIN_ID,
    // OPTIMISM_GOERLI_CHAIN_ID,
    // BASE_GOERLI_CHAIN_ID,
    // POLYGON_ZK_TESTNET_CHAIN_ID,
    LINEA_ZK_TESTNET_CHAIN_ID,
    // METIS_GOERLI_CHAIN_ID,
];
