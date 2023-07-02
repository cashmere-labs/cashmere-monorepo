import { Type } from '@sinclair/typebox';
import { TypeCompiler } from '@sinclair/typebox/compiler';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { useTypedEvent, validateTypeOrThrow } from '../../src';

describe('[Backend][Core] Types hooks', () => {
    // The function we will test
    let useTypedEventTest: typeof useTypedEvent;
    let validateTypeOrThrowTest: typeof validateTypeOrThrow;

    // Hooks for the memo mock
    const memoMock = vi.fn((cb: () => any) => cb());
    const useEventMock = vi.fn();

    // Generic types for an event
    const EventType = Type.Object({
        body: Type.String(),
    });
    const eventTypeCompiler = TypeCompiler.Compile(EventType);

    beforeAll(async () => {
        vi.doMock('sst/context', () => ({
            Context: {
                memo: memoMock,
            },
            useEvent: useEventMock,
        }));

        // Get the function to test
        const imports = await import('../../src/hooks/typesHooks');
        useTypedEventTest = imports.useTypedEvent;
        validateTypeOrThrowTest = imports.validateTypeOrThrow;
    });

    /**
     * After each test, restore all mocks
     */
    afterEach(() => {
        // Restore all mocks
        vi.restoreAllMocks();
    });

    describe('useTypedEvent', () => {
        it('[Ok] Should get the event from context, and use context for parsing', () => {
            useEventMock.mockReturnValue({ body: 'test' });
            const result = useTypedEventTest(EventType, 'api');

            expect(result).toEqual({ body: 'test' });
            expect(useEventMock).toHaveBeenCalledWith('api');
            expect(memoMock).toHaveBeenCalledOnce();
        });
        it('[Fail] Should throw back typing errors', () => {
            useEventMock.mockReturnValue({ body: 123 });
            expect(() => useTypedEventTest(EventType, 'api')).toThrowError(
                'invalid-arguments'
            );
            expect(useEventMock).toHaveBeenCalledWith('api');
            expect(memoMock).toHaveBeenCalledOnce();
        });
    });

    describe('validateTypeOrThrow', () => {
        it('[Ok] Should be ok with a valid type', () => {
            const result = validateTypeOrThrowTest(eventTypeCompiler, {
                body: 'test',
            });
            expect(result).toEqual({ body: 'test' });
        });
        it('[Fail] Should throw invalid argument error with an invalid type', () => {
            expect(() =>
                validateTypeOrThrowTest(eventTypeCompiler, { body: 123 })
            ).toThrowError('invalid-arguments');
        });
    });
});
