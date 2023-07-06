import { TypeSystem } from '@sinclair/typebox/system';
import { v4 as uuidv4 } from 'uuid';
import { Hex, isHex } from 'viem';

const uniqueString = uuidv4();
const key = process.env.NODE_ENV === 'test' ? uniqueString : 'Hex';

// Hex type validation
export const HexType = TypeSystem.Type<Hex>(key, (options, value) => {
    return typeof value === 'string' && isHex(value);
});
