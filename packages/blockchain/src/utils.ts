import { Address, getAddress, isAddressEqual } from 'viem';

export const NATIVE_PLACEHOLDER: Address = getAddress(
  '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
);
export const isPlaceholderToken: (token: Address) => boolean = (
  token: Address,
) => isAddressEqual(token, NATIVE_PLACEHOLDER);
