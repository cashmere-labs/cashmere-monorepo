import { createSigner, createVerifier } from 'fast-jwt';
import { Config } from 'sst/node/config';

// Create a signer for access tokens
export function getAccessSigner() {
    return createSigner({
        key: Config.JWT_ACCESS_SECRET,
        expiresIn: 15 * 60 * 1000, // 15 minutes
    });
}

// Create a verifier for access tokens
export function getAccessVerifier() {
    return createVerifier({
        key: Config.JWT_ACCESS_SECRET,
    });
}

// Create a signer for refresh tokens
export function getRefreshSigner() {
    return createSigner({
        key: Config.JWT_REFRESH_SECRET,
        expiresIn: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
}

// Create a verifier for refresh tokens
export function getRefreshVerifier() {
    return createVerifier({
        key: Config.JWT_REFRESH_SECRET,
    });
}
