import Big from 'big.js';
import { formatUnits } from 'viem';

export const formatBalance = (balance: bigint | string | Big | undefined, decimals = 4, tokenDecimal = 18) => {
  if (!balance) {
    return '0';
  }

  balance = BigInt(balance.toString());

  try {
    const _balance = formatUnits(balance, tokenDecimal).toString();

    const parts = _balance.split('.');
    if (parts[1]) parts[1] = parts[1].slice(0, decimals);
    const returned = parts.join('.');
    return returned;
  } catch (err) {
    console.log(err);
    return '';
  }
};
