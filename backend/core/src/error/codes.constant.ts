// Prefix for our error codes
const prefix = {
    request: 'req',
    server: 'internal',
};

// List of all the http error codes
export const errorCodes = {
    request: {
        'invalid-args': `${prefix.request}-001`,
        'not-found': `${prefix.request}-002`,
        'already-exists': `${prefix.request}-003`,
    },
    server: {
        internal: `${prefix.server}-001`,
    },
};
