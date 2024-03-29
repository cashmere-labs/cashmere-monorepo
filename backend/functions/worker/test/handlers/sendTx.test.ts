import { getSendTxQueueTypeCompiler } from '@cashmere-monorepo/shared-contract-worker';
import { Context, SQSEvent } from 'aws-lambda';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { handler } from '../../src/handlers/send_tx';

describe('[Functions][Worker] sendTx', () => {
    let handlerToTest: typeof handler;

    let validatedBody: any;
    const typeCompilerMock = vi.fn(() => validatedBody);
    const validateTypeOrThrowMock = vi.fn(() => validatedBody);

    const loggerInfoMock = vi.fn();
    const loggerWarnMock = vi.fn();

    const batchedTxServiceMock = {
        // throw an error when handling new tx
        handleNewTx: vi.fn(),
        sendBatchedTx: vi.fn(),
    };
    const buildBatchedTxServiceMock = vi.fn(() => batchedTxServiceMock);
    const getSendTxQueueTypeCompilerMock = vi.fn(
        () =>
            typeCompilerMock as unknown as ReturnType<
                typeof getSendTxQueueTypeCompiler
            >
    );

    beforeAll(async () => {
        vi.doMock('@cashmere-monorepo/backend-core', () => ({
            logger: {
                info: loggerInfoMock,
                warn: loggerWarnMock,
            },
            validateTypeOrThrow: validateTypeOrThrowMock,
        }));

        vi.doMock('@cashmere-monorepo/backend-service-worker', () => ({
            buildBatchedTxService: buildBatchedTxServiceMock,
        }));
        vi.doMock('@cashmere-monorepo/shared-contract-worker', () => ({
            getSendTxQueueTypeCompiler: getSendTxQueueTypeCompilerMock,
        }));

        handlerToTest = (await import('../../src/handlers/send_tx')).handler;
    });

    afterEach(() => {
        // Reset the mocks
        vi.clearAllMocks();
    });

    describe('handler', () => {
        it('should handle a new tx', async () => {
            const event = {
                Records: [
                    {
                        body: 'test-body',
                        messageId: 'test-message-id',
                    },
                    {
                        body: 'test-body-2',
                        messageId: 'test-message-id-2',
                    },
                ],
            } as SQSEvent;
            validatedBody = { chainId: 1 };

            const result = await handlerToTest(event, {} as Context);
            expect(loggerInfoMock).toHaveBeenCalledWith('Send TX handler');

            expect(buildBatchedTxServiceMock).toHaveBeenCalled();
            expect(batchedTxServiceMock.handleNewTx).toHaveBeenCalledWith(
                validatedBody
            );
            expect(batchedTxServiceMock.handleNewTx).toHaveBeenCalledTimes(2);

            expect(batchedTxServiceMock.sendBatchedTx).toHaveBeenCalledTimes(1);
            expect(loggerWarnMock).not.toHaveBeenCalled();
            expect(result).toEqual({
                batchItemFailures: [],
            });
        });

        it('should handle errors during record handling and batched tx sending', async () => {
            const event = {
                Records: [
                    {
                        body: 'test-body',
                        messageId: 'message-id-1',
                    },
                ],
            } as SQSEvent;

            validatedBody = { chainId: 123 };

            batchedTxServiceMock.handleNewTx.mockRejectedValueOnce(
                new Error('test-error')
            );

            await handlerToTest(event, {} as Context);

            expect(loggerInfoMock).toHaveBeenCalledWith('Send TX handler');
            expect(buildBatchedTxServiceMock).toHaveBeenCalled();

            // the error is handled and logged, so we are inside catch block
            expect(loggerWarnMock).toHaveBeenCalledWith(
                {
                    record: { body: 'test-body', messageId: 'message-id-1' },
                    e: expect.any(Error),
                },
                'An error occurred while handling a record'
            );
        });

        it('should handle errors during batched tx sending', async () => {
            const event = {
                Records: [
                    {
                        body: 'test-body',
                        messageId: 'message-id-1',
                    },
                ],
            } as SQSEvent;

            validatedBody = { chainId: 123 };

            batchedTxServiceMock.sendBatchedTx.mockRejectedValueOnce(
                new Error('test-error')
            );

            await handlerToTest(event, {} as Context);

            expect(loggerInfoMock).toHaveBeenCalledWith('Send TX handler');

            expect(buildBatchedTxServiceMock).toHaveBeenCalled();
            expect(batchedTxServiceMock.sendBatchedTx).toHaveBeenCalledTimes(1);

            // the error is handled and logged, so we are inside catch block
            expect(loggerWarnMock).toHaveBeenCalledWith(
                {
                    chainId: 123,
                    e: expect.any(Error),
                },
                'An error occurred while sending batched tx for a chain'
            );
        });
    });
});
