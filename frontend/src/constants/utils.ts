export const NUMBER_REGEX = /^-?\d*\.?\d*$/;
export const IS_PROD = process.env.NODE_ENV !== 'development';
export const apiDomain = !IS_PROD ? 'localhost:3003' : location.host;
export const apiAddress = `//${apiDomain}`;
export const PLACEHOLDER_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
export const MAX_UINT256: bigint = 115792089237316195423570985008687907853269984665640564039457584007913129639935n;
