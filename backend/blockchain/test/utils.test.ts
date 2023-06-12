import { isAddressEqual } from 'viem';
import { describe, expect, it } from 'vitest';
import { NATIVE_PLACEHOLDER, isPlaceholderToken } from '../src';

describe('[Backend][Blockchain] Utils', () => {
    it('[Ok] Has correct placeholder address', () => {
        expect(
            isAddressEqual(
                NATIVE_PLACEHOLDER,
                '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
            )
        ).to.be.true;
    });

    it('[Ok] Returns true for placeholder address', () => {
        expect(isPlaceholderToken('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'))
            .to.be.true;
    });

    it('[Ok] Returns false for non-placeholder address', () => {
        expect(isPlaceholderToken('0x0000000000000000000000000000000000000000'))
            .to.be.false;
    });
});
