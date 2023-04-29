export const continueSwapFunctionABI = {
  stateMutability: 'nonpayable',
  type: 'function',
  inputs: [
    {
      name: 'params',
      internalType: 'struct CashmereAggregatorUniswap.ContinueSwapParams',
      type: 'tuple',
      components: [
        { name: 'srcChainId', internalType: 'uint16', type: 'uint16' },
        { name: 'id', internalType: 'bytes32', type: 'bytes32' },
      ],
    },
  ],
  name: 'continueSwap',
  outputs: [],
} as const;

export const startSwapFunctionABI = {
  stateMutability: 'payable',
  type: 'function',
  inputs: [
    {
      name: 'params',
      internalType: 'struct CashmereAggregatorUniswap.SwapParams',
      type: 'tuple',
      components: [
        {
          name: 'srcToken',
          internalType: 'contract IERC20',
          type: 'address',
        },
        { name: 'srcAmount', internalType: 'uint256', type: 'uint256' },
        { name: 'lwsPoolId', internalType: 'uint16', type: 'uint16' },
        { name: 'hgsPoolId', internalType: 'uint16', type: 'uint16' },
        {
          name: 'dstToken',
          internalType: 'contract IERC20',
          type: 'address',
        },
        { name: 'dstChain', internalType: 'uint16', type: 'uint16' },
        {
          name: 'dstAggregatorAddress',
          internalType: 'address',
          type: 'address',
        },
        {
          name: 'minHgsAmount',
          internalType: 'uint256',
          type: 'uint256',
        },
        { name: 'signature', internalType: 'bytes', type: 'bytes' },
      ],
    },
  ],
  name: 'startSwap',
  outputs: [],
} as const;

export const pendingSwapsFunctionAbi = {
  stateMutability: 'view',
  type: 'function',
  inputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
  name: 'pendingSwaps',
  outputs: [
    { name: 'id', internalType: 'bytes32', type: 'bytes32' },
    { name: 'lwsToken', internalType: 'contract IERC20', type: 'address' },
    { name: 'lwsPoolId', internalType: 'uint16', type: 'uint16' },
    { name: 'hgsPoolId', internalType: 'uint16', type: 'uint16' },
    { name: 'dstToken', internalType: 'contract IERC20', type: 'address' },
    { name: 'dstChainId', internalType: 'uint16', type: 'uint16' },
    { name: 'receiver', internalType: 'address', type: 'address' },
    { name: 'processed', internalType: 'bool', type: 'bool' },
    { name: 'minHgsAmount', internalType: 'uint256', type: 'uint256' },
    { name: 'signature', internalType: 'bytes', type: 'bytes' },
  ],
} as const;
