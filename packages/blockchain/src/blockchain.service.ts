/* eslint-disable max-lines */

import { Mutex } from 'async-mutex';
import {
  Address,
  createPublicClient,
  decodeFunctionData,
  encodeAbiParameters,
  getAddress,
  Hash,
  Hex,
  http,
  parseGwei,
  PublicClient,
} from 'viem';

import {
  crossChainSwapInitiatedEventABI,
  swapMessageReceivedEventABI,
} from './abis/eventAbis';
import {
  pendingSwapsFunctionAbi,
  startSwapFunctionABI,
} from './abis/methodAbis';
import {
  assetRouterABI,
  bridgeABI,
  erc20ABI,
  iAssetV2ABI,
  iUniswapV2PairABI,
  iUniswapV2Router02ABI,
} from './abis/wagmiGenerated';
import { BlockchainConfig, networkConfigs } from './config/blockchain.config';
import { QuoteSwapParam } from './types/QuoteSwapParam';
import { isPlaceholderToken } from './utils';

// Expiration delay for our cache
const cacheExpirationDelay = 2 * 60 * 1000;

/**
 * Represent a network factory repository
 */
export class BlockchainService {
  // The current nonces cache
  private readonly noncesMap: Nonces = {};

  // The current blockchain cache
  private readonly blockchainCache: MultichainCache = {};

  // Async mutex to ensure no concurrent access to the nonces caches
  private readonly noncesMutex: Mutex = new Mutex();

  /**
   * Get a network service for the given chain id
   * @param chainId
   */
  getClientForChain(chainId: number): PublicClient {
    // Find the config
    const config: BlockchainConfig | undefined =
      networkConfigs[chainId.toString()];
    if (!config) {
      throw new Error(`Config for chain id ${chainId} not found`);
    }

    // Build our viem client
    return createPublicClient({
      chain: config.chain,
      transport: http(config.rpcUrl, {
        retryCount: 5,
        retryDelay: 2_000,
        timeout: 30_000,
      }),
    });
  }

  /**
   * Get a network service for the given chain id
   * @param chainId
   */
  getForChain(chainId: number): BlockchainInterface {
    // Find the config
    const config: BlockchainConfig | undefined =
      networkConfigs[chainId.toString()];
    if (!config) {
      throw new Error(`Config for chain id ${chainId} not found`);
    }

    // Get the client
    const client = this.getClientForChain(chainId);

    // Get the cache or build it for this chain
    if (!this.blockchainCache[chainId]) {
      this.blockchainCache[chainId] = {};
    }

    return {
      client,
      config,
      name: config.chain.name,
      chainId,
      contracts: buildContractsInterfaceForChain(
        client,
        config,
        this.cacheAccessor,
      ),
    };
  }

  getLastSafeBlockForChain(chain: number): Promise<bigint> {
    return this.getClientForChain(chain).getBlockNumber();
  }

  /**
   * Get the current wallet nonce for given chain and address
   * Store that in the service layer to ensure same object used accross every service
   * @param chainId
   * @param address
   */
  getWalletNonce(chainId: number, address: Address): Promise<number> {
    return this.noncesMutex.runExclusive(async () => {
      // Get the latest nonce from the network
      const nextNetworkNonce = await this.getClientForChain(
        chainId,
      ).getTransactionCount({ address, blockTag: 'pending' });
      // Check if we already got a nonce for this chain and address
      const currentNonce = this.noncesMap[chainId]?.[address];
      // Our new nonce
      let newNonce: number;
      if (currentNonce && currentNonce >= nextNetworkNonce - 1) {
        // Case where our local nonce is in sync and in advance
        newNonce = currentNonce + 1;
      } else if (currentNonce && currentNonce < nextNetworkNonce - 1) {
        // Case where our local nonce is off-sync with blockchain
        newNonce = nextNetworkNonce;
      } else {
        // Case where we don't have any nonce yet
        newNonce = nextNetworkNonce;
      }
      // Store the new nonce
      if (!this.noncesMap[chainId]) {
        this.noncesMap[chainId] = {};
      }
      this.noncesMap[chainId]![address] = newNonce;

      // Return the new nonce
      return newNonce;
    });
  }

  /**
   * Get or set a value from a chain cache
   * @param chainId
   * @param key
   * @param valueAccessor
   */
  private cacheAccessor: CacheAccessor = async <T>(
    chainId: number,
    key: string,
    valueAccessor: () => Promise<T>,
    shouldExpire = false,
  ) => {
    // Get the cache or build it for this chain
    if (!this.blockchainCache[chainId]) {
      this.blockchainCache[chainId] = {};
    }
    // Check if we got an expired value, if yes reset it, expiration time of 2min
    const currentDate = new Date();
    if (
      this.blockchainCache[chainId]![key] &&
      shouldExpire &&
      currentDate.getTime() -
        (this.blockchainCache[chainId]![key]?.creation?.getTime() ?? 0) >
        cacheExpirationDelay
    ) {
      this.blockchainCache[chainId]![key] = undefined;
    }
    // Check if we already have the value in cache
    if (this.blockchainCache[chainId]![key]) {
      return this.blockchainCache[chainId]![key]!.value as T;
    }
    const value = await valueAccessor();
    this.blockchainCache[chainId]![key] = { value, creation: currentDate };

    return value;
  };
}

// Access or update our cached value
type CacheAccessor = <T>(
  chainId: number,
  key: string,
  valueAccessor: () => Promise<T>,
  shouldExpire?: boolean,
) => Promise<T>;

export type BlockchainInterface = {
  client: PublicClient;
  config: BlockchainConfig;
  name: string;
  chainId: number;
  contracts: BlockchainContractsInterface;
};

/**
 * Build the contracts interface for the given chain
 * @param client
 * @param config
 * @param cacheAccessor
 */
const buildContractsInterfaceForChain = (
  client: PublicClient,
  config: BlockchainConfig,
  cacheAccessor: CacheAccessor,
) => {
  // Generic function used multiple time
  const assetRouterGetPool = (poolId: number) =>
    cacheAccessor(
      config.chain.id,
      `assetRouterGetPool-${poolId}`,
      () =>
        client.readContract({
          address: config.getContractAddress('assetRouter'),
          abi: assetRouterABI,
          functionName: 'getPool',
          args: [poolId],
        }),
      true, // This value is cached for 2min, in case the pool changes
    );

  // Build the contracts interface
  return {
    // Get the gas fees param
    getGasFeesParam: async () => {
      // Build additional gas param
      const latestBlock = await client.getBlock();
      if (latestBlock.baseFeePerGas) {
        // In case of EIP-1559 fees (Same as prepare request from viem, but with 2x multiplier instead of 1.2x, required for mumbai:
        // https://github.com/wagmi-dev/viem/blob/5539f3515e37637347b242ec5a24115c6a960c7d/src/utils/transaction/prepareRequest.ts#L91
        const maxPriorityFeePerGas = parseGwei('1.5');
        const maxFeePerGas =
          (latestBlock.baseFeePerGas * 200n) / 100n + maxPriorityFeePerGas;

        return { maxPriorityFeePerGas, maxFeePerGas };
      } else {
        // In case of legacy tx
        const gasPrice = await client.getGasPrice();

        return { gasPrice };
      }
    },

    /****************************************
     * Aggregator method's
     ****************************************/
    aggregatorParseStartSwapArgs: async (hash: Hash) =>
      decodeFunctionData({
        abi: [startSwapFunctionABI],
        data: (await client.getTransaction({ hash })).input,
      }),

    aggregatorGetPendingSwap: async (swapId: Hex) =>
      client.readContract({
        abi: [pendingSwapsFunctionAbi],
        address: config.getContractAddress('aggregator'),
        functionName: 'pendingSwaps',
        args: [swapId],
      }),

    /****************************************
     * Uniswap router method's
     ****************************************/
    uniswapRouterGetAmoutOut: (
      fromAmount: bigint,
      fromToken: Address,
      toToken: Address,
    ): Promise<readonly bigint[]> =>
      client.readContract({
        address: config.getContractAddress('uniswapV2Router02'),
        abi: iUniswapV2Router02ABI,
        functionName: 'getAmountsOut',
        args: [fromAmount, [fromToken, toToken]],
      }),

    uniswapRouterGetAmoutOutMulticall: async (
      params: {
        fromAmount: bigint;
        fromToken: Address;
        toToken: Address;
      }[],
    ) => {
      // If it doesn't handle multicall do that directly
      if (config.chain.contracts?.multicall3 === undefined) {
        return await Promise.all(
          params.map(async param => {
            const result = await client.readContract({
              address: config.getContractAddress('uniswapV2Router02'),
              abi: iUniswapV2Router02ABI,
              functionName: 'getAmountsOut',
              args: [param.fromAmount, [param.fromToken, param.toToken]],
            });

            return { status: 'success', result };
          }),
        );
      }

      // Otherwise, use multicall
      return client.multicall({
        contracts: params.map(param => ({
          address: config.getContractAddress('uniswapV2Router02'),
          abi: iUniswapV2Router02ABI,
          functionName: 'getAmountsOut',
          args: [param.fromAmount, [param.fromToken, param.toToken]],
        })),
      });
    },

    uniswapRouterWETH: (): Promise<Address> =>
      cacheAccessor(config.chain.id, 'uniswapRouterWETH', async () =>
        client.readContract({
          address: config.getContractAddress('uniswapV2Router02'),
          abi: iUniswapV2Router02ABI,
          functionName: 'WETH',
        }),
      ),

    /****************************************
     * Asset router method's
     ****************************************/
    assetRouterQuoteSwap: (params: QuoteSwapParam) =>
      client.readContract({
        address: config.getContractAddress('assetRouter'),
        abi: assetRouterABI,
        functionName: 'quoteSwap',
        args: [params],
      }),

    assetRouterQuoteSwapMulticall: async (params: QuoteSwapParam[]) => {
      // If it doesn't handle multicall do that directly
      if (config.chain.contracts?.multicall3 === undefined) {
        return await Promise.all(
          params.map(async param => {
            const result = await client.readContract({
              address: config.getContractAddress('assetRouter'),
              abi: assetRouterABI,
              functionName: 'quoteSwap',
              args: [param],
            });

            return { status: 'success', result };
          }),
        );
      }

      // Otherwise, use multicall
      return client.multicall({
        contracts: params.map(param => ({
          address: config.getContractAddress('assetRouter'),
          abi: assetRouterABI,
          functionName: 'quoteSwap',
          args: [param],
        })),
      });
    },

    assetRouterGetPool,

    assetRouterGetPoolIdsPerChain: (chainId: number, index: bigint) =>
      client.readContract({
        address: config.getContractAddress('assetRouter'),
        abi: assetRouterABI,
        functionName: 'poolIdsPerChain',
        args: [chainId, index],
      }),

    assetRouterGetSwapInitiatedEvents: (blockConfig: {
      fromBlock: bigint;
      toBlock: bigint;
    }) =>
      client.getLogs({
        address: config.getContractAddress('assetRouter'),
        event: crossChainSwapInitiatedEventABI,
        ...blockConfig,
      }),

    /****************************************
     * Asset contract method's
     ****************************************/
    assetContractTokenFromPoolId: async (poolId: number): Promise<Address> => {
      // Get the pool
      const pool = await assetRouterGetPool(poolId);

      // Then get the asset contract token from the pool
      return cacheAccessor(
        config.chain.id,
        `poolToken:${pool.poolAddress}`,
        async () =>
          client.readContract({
            address: getAddress(pool.poolAddress),
            abi: iAssetV2ABI,
            functionName: 'token',
          }),
      );
    },

    /****************************************
     * Uniswap Pair method's
     ****************************************/
    uniswapPairToken0: (): Promise<Address> =>
      cacheAccessor(
        config.chain.id,
        'uniswapPairToken0',
        async () =>
          client.readContract({
            address: config.getContractAddress('uniswapV2Pair'),
            abi: iUniswapV2PairABI,
            functionName: 'token0',
          }),
        // Expiration of 2min in case of a token changes
        // TODO : Is that possible?
        true,
      ),

    uniswapPairToken1: (): Promise<Address> =>
      cacheAccessor(
        config.chain.id,
        'uniswapPairToken1',
        async () =>
          client.readContract({
            address: config.getContractAddress('uniswapV2Pair'),
            abi: iUniswapV2PairABI,
            functionName: 'token1',
          }),
        // Expiration of 2min in case of a token changes
        // TODO : Is that possible?
        true,
      ),

    uniswapPairReserve: (): Promise<readonly [bigint, bigint, number]> =>
      client.readContract({
        address: config.getContractAddress('uniswapV2Pair'),
        abi: iUniswapV2PairABI,
        functionName: 'getReserves',
      }),

    /****************************************
     * ERC20 token method's
     ****************************************/
    tokenSymbol: (address: string): Promise<string> =>
      cacheAccessor(config.chain.id, `tokenSymbol:${address}`, async () =>
        isPlaceholderToken(getAddress(address))
          ? client.chain!.nativeCurrency.symbol
          : client.readContract({
              address: getAddress(address),
              abi: erc20ABI,
              functionName: 'symbol',
            }),
      ),

    tokenDecimal: (address: string): Promise<number> =>
      cacheAccessor(config.chain.id, `tokenDecimal:${address}`, async () =>
        isPlaceholderToken(getAddress(address))
          ? client.chain!.nativeCurrency.decimals
          : client.readContract({
              address: getAddress(address),
              abi: erc20ABI,
              functionName: 'decimals',
            }),
      ),

    /****************************************
     * Bridge method's
     ****************************************/
    bridgeGetSwapMessageReceivedEvents: (blockConfig: {
      fromBlock: bigint;
      toBlock: bigint;
    }) =>
      client.getLogs({
        address: config.getContractAddress('bridge'),
        event: swapMessageReceivedEventABI,
        ...blockConfig,
      }),

    swapFeeL0: async (toNetworkChainId: string): Promise<bigint> => {
      const feeTuple = await cacheAccessor(
        config.chain.id,
        `feeType:${toNetworkChainId}`,
        async () => {
          const estimatePayload = encodeAbiParameters(
            [{ type: 'bytes' }],
            [`0x${'00'.repeat(2 + 2 + 20 + 32 + 20 + 65)}`], // uint16, uint16, address, uint256, address, (signature)
          );

          return client.readContract({
            address: config.getContractAddress('bridge'),
            abi: bridgeABI,
            functionName: 'quoteLayerZeroFee',
            args: [parseInt(toNetworkChainId), 1, estimatePayload],
          });
        },
        true,
      );

      return feeTuple[0];
    },

    bridgeGetReceivedSwaps: async (srcChainId: number, swapId: Hex) =>
      client.readContract({
        address: config.getContractAddress('bridge'),
        abi: bridgeABI,
        functionName: 'getReceivedSwaps',
        args: [
          parseInt(networkConfigs[srcChainId.toString()]!.l0ChainId),
          swapId,
        ],
      }),
  };
};

// Export the type of our interface
export type BlockchainContractsInterface = ReturnType<
  typeof buildContractsInterfaceForChain
>;

// Represent our nonces cache
interface Nonces {
  [chainId: number]: {
    [address: string]: number;
  };
}

// Represent our blockchain cache
interface MultichainCache {
  [chainId: number]: BlockchainCache;
}
interface BlockchainCache {
  [key: string]:
    | {
        value: unknown;
        creation?: Date;
      }
    | undefined;
}
