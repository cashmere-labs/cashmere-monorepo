import {
    TOptional,
    TReadonly,
    TSchema,
    TUnknown,
    Type,
} from '@sinclair/typebox';

/* ---------------
  * Pick a schema if it's present
  --------------- */

// TODO: Fix typing issue on return, maybe should use a declare function with overload or something similar?
export const getTypeSchemaIfDefined = <Type extends TSchema>(
    type?: Type | undefined
): TypeIfPresentOrUnknown<Type> => {
    if (type) {
        // @ts-ignore
        return type;
    }
    // @ts-ignore
    return Type.Optional(Type.Unknown());
};

/**
 * Common type for a maybe undefined value
 */
export type TypeIfPresentOrUnknown<Type extends TSchema | undefined> =
    Type extends TSchema ? Type : TOptional<TUnknown>;

/* ---------------
  * Pick a schema if it's present
  --------------- */
export const getReadonlyTypeSchemaIfDefined = <Type extends TSchema>(
    type?: Type | undefined
): ReadonlyTypeIfPresent<Type> => Type.Readonly(getTypeSchemaIfDefined(type));

/**
 * Common type for a maybe undefined value
 */
export type ReadonlyTypeIfPresent<Type extends TSchema | undefined> = TReadonly<
    TypeIfPresentOrUnknown<Type>
>;
