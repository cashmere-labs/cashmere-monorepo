import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { handler } from '../../src/handlers/bridge';

describe('[Functions][Worker] bridgeHandler', () => {
    let handlerToTest: typeof handler;

    const scanEveryBlockchainMock = vi.fn();
    const loggerInfo = vi.fn();

    beforeAll(async () => {
        vi.doMock('@cashmere-monorepo/backend-core', () => ({
            logger: {
                info: loggerInfo,
            },
            useLogger: vi.fn(),
        }));

        vi.doMock('@cashmere-monorepo/backend-service-worker', () => ({
            scanEveryBlockchain: scanEveryBlockchainMock,
        }));

        handlerToTest = (await import('../../src/handlers/bridge')).handler;
    });

    afterEach(() => {
        // Reset the mocks
        vi.clearAllMocks();
    });

    it('should log a message and execute the bridge event handler', async () => {
        vi.stubEnv('IS_RUNNING_IN_PROD', 'true');
        // @ts-ignore
        await handlerToTest();

        expect(scanEveryBlockchainMock).toHaveBeenCalledOnce();
    });

    it('shouldnt do anything if not in prod', async () => {
        vi.stubEnv('IS_RUNNING_IN_PROD', 'false');
        // @ts-ignore
        await handlerToTest();

        expect(loggerInfo).toHaveBeenCalledWith(
            'Skipping bridge scan when not in prod'
        );
        expect(scanEveryBlockchainMock).not.toHaveBeenCalledOnce();
    });
});
