/**
 * Check if we are running in prod or not
 */
export const isRunningInProd = (): boolean => {
    // Get the raw value from the env
    const raw = process.env.IS_RUNNING_IN_PROD;
    if (!raw || typeof raw !== 'string') return false;

    // Ensure it's the valid type
    return /^\s*(true|1|on)\s*$/i.test(raw);
};
