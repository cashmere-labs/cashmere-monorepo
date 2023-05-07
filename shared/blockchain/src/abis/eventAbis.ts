// Direct cross chain swap initiated event ABI, to be lighter on execution
import { Log } from 'viem';

export const crossChainSwapInitiatedEventABI = {
  type: 'event',
  anonymous: false,
  inputs: [
    { name: 'sender', internalType: 'address', type: 'address', indexed: true },
    { name: 'id', internalType: 'bytes32', type: 'bytes32', indexed: false },
    {
      name: 'srcPoolId',
      internalType: 'uint16',
      type: 'uint16',
      indexed: false,
    },
    {
      name: 'dstChainId',
      internalType: 'uint16',
      type: 'uint16',
      indexed: false,
    },
    {
      name: 'dstPoolId',
      internalType: 'uint16',
      type: 'uint16',
      indexed: false,
    },
    {
      name: 'amount',
      internalType: 'uint256',
      type: 'uint256',
      indexed: false,
    },
    { name: 'fee', internalType: 'uint256', type: 'uint256', indexed: false },
    {
      name: 'vouchers',
      internalType: 'uint256',
      type: 'uint256',
      indexed: false,
    },
    {
      name: 'optimalDstBandwidth',
      internalType: 'uint256',
      type: 'uint256',
      indexed: false,
    },
    { name: 'payload', internalType: 'bytes', type: 'bytes', indexed: false },
  ],
  name: 'CrossChainSwapInitiated',
} as const;

export type CrossChainSwapInitiatedLogType = Log<
  bigint,
  number,
  typeof crossChainSwapInitiatedEventABI,
  [typeof crossChainSwapInitiatedEventABI],
  'CrossChainSwapInitiated'
>;

// Direct cross chain swap performed event ABI, to be lighter on execution
export const crossChainSwapPerformedEventABI = {
  type: 'event',
  anonymous: false,
  inputs: [
    {
      name: 'srcPoolId',
      internalType: 'uint16',
      type: 'uint16',
      indexed: false,
    },
    {
      name: 'dstPoolId',
      internalType: 'uint16',
      type: 'uint16',
      indexed: false,
    },
    {
      name: 'srcChainId',
      internalType: 'uint16',
      type: 'uint16',
      indexed: false,
    },
    { name: 'to', internalType: 'address', type: 'address', indexed: false },
    {
      name: 'amount',
      internalType: 'uint256',
      type: 'uint256',
      indexed: false,
    },
    { name: 'fee', internalType: 'uint256', type: 'uint256', indexed: false },
  ],
  name: 'CrossChainSwapPerformed',
} as const;

export type CrossChainSwapPerformedLogType = Log<
  bigint,
  number,
  typeof crossChainSwapPerformedEventABI,
  [typeof crossChainSwapPerformedEventABI],
  'CrossChainSwapPerformed'
>;

// Direct cross chain swap continued event ABI, to be lighter on execution
export const swapContinuedEventABI = {
  type: 'event',
  anonymous: false,
  inputs: [
    { name: 'id', internalType: 'bytes32', type: 'bytes32', indexed: false },
  ],
  name: 'SwapContinued',
} as const;

export type SwapContinuedLogType = Log<
  bigint,
  number,
  typeof swapContinuedEventABI,
  [typeof swapContinuedEventABI],
  'SwapContinued'
>;

// Bridge swap message received event, required to extract swap id
export const swapMessageReceivedEventABI = {
  type: 'event',
  anonymous: false,
  inputs: [
    {
      name: '_message',
      internalType: 'struct IAssetRouter.SwapMessage',
      type: 'tuple',
      components: [
        { name: 'srcChainId', internalType: 'uint16', type: 'uint16' },
        { name: 'srcPoolId', internalType: 'uint16', type: 'uint16' },
        { name: 'dstPoolId', internalType: 'uint16', type: 'uint16' },
        { name: 'receiver', internalType: 'address', type: 'address' },
        { name: 'amount', internalType: 'uint256', type: 'uint256' },
        { name: 'fee', internalType: 'uint256', type: 'uint256' },
        { name: 'vouchers', internalType: 'uint256', type: 'uint256' },
        {
          name: 'optimalDstBandwidth',
          internalType: 'uint256',
          type: 'uint256',
        },
        { name: 'id', internalType: 'bytes32', type: 'bytes32' },
        { name: 'payload', internalType: 'bytes', type: 'bytes' },
      ],
      indexed: false,
    },
  ],
  name: 'SwapMessageReceived',
} as const;

export type SwapMessageReceivedLogType = Log<
  bigint,
  number,
  typeof swapMessageReceivedEventABI,
  [typeof swapMessageReceivedEventABI],
  'SwapMessageReceived'
>;
