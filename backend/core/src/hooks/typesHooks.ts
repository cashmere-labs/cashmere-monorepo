import { Static, TSchema } from '@sinclair/typebox';
import { TypeCheck, TypeCompiler } from '@sinclair/typebox/compiler';
import { Context, useEvent } from 'sst/context';
import { InvalidArgumentsError } from '../error';

/**
 * Ensure the validity of the event type
 */
export const useTypedEvent = <T extends TSchema>(
    schema: T,
    type: 'api' | 'ws' | 'sqs'
): Static<T> => {
    // Build our event type compiler
    const eventTypeCompiler = TypeCompiler.Compile(schema);

    // Check the types
    return Context.memo(() => {
        const event = useEvent(type);
        return validateTypeOrThrow(eventTypeCompiler, event);
    });
};

// Validate a type from a type compiler or throw an error
export function validateTypeOrThrow<SchemaType extends TSchema>(
    eventTypeCompiler: TypeCheck<SchemaType>,
    object: unknown
): Static<SchemaType> {
    // Ensure the request match the input
    if (eventTypeCompiler.Check(object)) return object;
    // Otherwise throw an error
    const errors = [...eventTypeCompiler.Errors(object)];
    // Build a message string
    const messageString = `Invalid request: ${errors
        .map(
            (error) =>
                `path: ${error.path}, value: ${error.value}, msg: ${error.message}`
        )
        .join('; ')}`;
    // Return the message string
    throw new InvalidArgumentsError(messageString, errors);
}
