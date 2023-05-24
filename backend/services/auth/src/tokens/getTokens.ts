import { Address } from 'viem';
import { JwtPayload } from '../dto';
import { getAccessSigner, getRefreshSigner } from './jwt';

/**
 * Get a new access token and refresh token for the given address.
 * @param address
 */
export async function getTokens(address: Address) {
    // Get both tokens
    const accessToken = getAccessSigner()({ sub: address } as JwtPayload);
    const refreshToken = getRefreshSigner()({ sub: address } as JwtPayload);

    return {
        accessToken,
        refreshToken,
    };
}
