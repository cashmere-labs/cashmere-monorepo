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
        conflict: `${prefix.request}-003`,
        forbidden: `${prefix.request}-004`,
        unauthorized: `${prefix.request}-005`,
    },
    server: {
        internal: `${prefix.server}-001`,
    },
};
