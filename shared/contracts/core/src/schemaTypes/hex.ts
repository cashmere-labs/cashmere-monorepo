import { TypeSystem } from '@sinclair/typebox/system';
import { Hex, isHex } from 'viem';

// Hex type validation
export const HexType = TypeSystem.Type<Hex>('Hex', (options, value) => {
    return typeof value === 'string' && isHex(value);
});
