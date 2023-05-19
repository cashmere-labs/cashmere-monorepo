import { TSchema } from '@sinclair/typebox';
import { TypeCompiler } from '@sinclair/typebox/compiler';
import { Context, useEvent } from 'sst/context';
import { validateTypeOrThrow } from '../contracts';

/**
 * Ensure the validity of the event type
 */
export const useTypedEvent = <T extends TSchema>(
    schema: T,
    type: 'api' | 'ws' | 'sqs'
) => {
    // Build our event type compiler
    const eventTypeCompiler = TypeCompiler.Compile(schema);

    // Check the types
    return Context.memo(() => {
        const event = useEvent(type);
        return validateTypeOrThrow(eventTypeCompiler, event);
    });
};
