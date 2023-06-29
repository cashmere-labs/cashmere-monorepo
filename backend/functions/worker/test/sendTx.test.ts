import {
    logger,
    useLogger,
    validateTypeOrThrow,
} from '@cashmere-monorepo/backend-core';
import { buildBatchedTxService } from '@cashmere-monorepo/backend-service-worker';
import { getSendTxQueueTypeCompiler } from '@cashmere-monorepo/shared-contract-worker';
import { SQSEvent } from 'aws-lambda';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handler } from '../src/handlers/send_tx';

describe('sendTx', () => {
    vi.mock('@cashmere-monorepo/backend-core', () => ({
        logger: {
            info: vi.fn(),
            warn: vi.fn(),
        },
        useLogger: vi.fn(),
        validateTypeOrThrow: vi.fn(),
    }));

    vi.mock('@cashmere-monorepo/backend-service-worker', () => ({
        buildBatchedTxService: vi.fn(),
    }));
    vi.mock('@cashmere-monorepo/shared-contract-worker/src/sendTx', () => ({
        getSendTxQueueTypeCompiler: vi.fn(),
    }));

    beforeEach(() => {
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
            const validatedBody = { chainId: 1 };

            const batchedTxServiceMock = {
                handleNewTx: vi.fn(),
                sendBatchedTx: vi.fn(),
            };

            const typeCompilerMock = vi.fn(() => validatedBody);

            vi.mocked(getSendTxQueueTypeCompiler).mockReturnValue(
                typeCompilerMock as unknown as ReturnType<
                    typeof getSendTxQueueTypeCompiler
                >
            );

            vi.mocked(useLogger).mockReturnValue(undefined);

            vi.mocked(validateTypeOrThrow).mockReturnValue(validatedBody);
            vi.mocked(buildBatchedTxService).mockResolvedValue(
                batchedTxServiceMock
            );

            // @ts-ignore
            const result = await handler(event);
            expect(useLogger).toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalledWith('Send TX handler');

            expect(buildBatchedTxService).toHaveBeenCalled();
            expect(batchedTxServiceMock.handleNewTx).toHaveBeenCalledWith(
                validatedBody
            );
            expect(batchedTxServiceMock.handleNewTx).toHaveBeenCalledTimes(2);

            expect(batchedTxServiceMock.sendBatchedTx).toHaveBeenCalledTimes(1);
            expect(logger.warn).not.toHaveBeenCalled();
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

            const validatedBody = { chainId: 123 };

            const batchedTxServiceMock = {
                // throw an error when handling new tx
                handleNewTx: vi.fn(() => {
                    throw new Error('test-error');
                }),
                sendBatchedTx: vi.fn(),
            };

            const typeCompilerMock = vi.fn(() => validatedBody);

            vi.mocked(useLogger).mockReturnValue(undefined);
            vi.mocked(validateTypeOrThrow).mockReturnValue(validatedBody);

            vi.mocked(buildBatchedTxService).mockResolvedValue(
                batchedTxServiceMock
            );
            vi.mocked(getSendTxQueueTypeCompiler).mockReturnValue(
                typeCompilerMock as unknown as ReturnType<
                    typeof getSendTxQueueTypeCompiler
                >
            );

            vi.mocked(buildBatchedTxService).mockResolvedValue(
                batchedTxServiceMock
            );

            // @ts-ignore
            const result = await handler(event);

            expect(useLogger).toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalledWith('Send TX handler');

            expect(buildBatchedTxService).toHaveBeenCalled();

            // the error is handled and logged, so we are inside catch block
            expect(logger.warn).toHaveBeenCalledWith(
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

            const validatedBody = { chainId: 123 };

            const batchedTxServiceMock = {
                handleNewTx: vi.fn(),
                // throw an error when sending batched tx
                sendBatchedTx: vi.fn(() => {
                    throw new Error('test-error');
                }),
            };

            const typeCompilerMock = vi.fn(() => validatedBody);

            vi.mocked(useLogger).mockReturnValue(undefined);
            vi.mocked(validateTypeOrThrow).mockReturnValue(validatedBody);

            vi.mocked(buildBatchedTxService).mockResolvedValue(
                batchedTxServiceMock
            );
            vi.mocked(getSendTxQueueTypeCompiler).mockReturnValue(
                typeCompilerMock as unknown as ReturnType<
                    typeof getSendTxQueueTypeCompiler
                >
            );

            vi.mocked(buildBatchedTxService).mockResolvedValue(
                batchedTxServiceMock
            );

            // @ts-ignore
            const result = await handler(event);

            expect(useLogger).toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalledWith('Send TX handler');

            expect(buildBatchedTxService).toHaveBeenCalled();
            expect(batchedTxServiceMock.sendBatchedTx).toHaveBeenCalledTimes(1);

            // the error is handled and logged, so we are inside catch block
            expect(logger.warn).toHaveBeenCalledWith(
                {
                    chainId: 123,
                    e: expect.any(Error),
                },
                'An error occurred while sending batched tx for a chain'
            );
        });
    });
});
