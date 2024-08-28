/* eslint-disable @typescript-eslint/no-explicit-any */

type NullStruct = ['null']
type StringStruct<T extends string> = ['string', T?]
type NumberStruct<T extends number> = ['number', T?]
type IntegerStruct<T extends number> = ['integer', T?]
type BooleanStruct<T extends boolean> = ['boolean', T?]
type TupleStruct<T extends [...any[]]> = ['tuple', { [I in keyof T]: ParseStruct<T[I]> }, T?]
type SubTypeStruct<T extends { type: string }> = ['subtype', { [S in T['type']]: ParseStruct<Omit<Extract<T, { type: S }>, 'type'>> }, T?]
type ArrayStruct<T extends any[]> = ['array', ParseStruct<T[keyof T]>, ElementOf<T>[]?]
type ObjectStruct<T> = ['object', { [K in keyof T]: ParseStruct<T[K]> }, T?]

export type ParseStruct<T> =
    T extends null ? NullStruct :
    T extends string ? StringStruct<T> :
    T extends number ? NumberStruct<T> | IntegerStruct<T> :
    T extends boolean ? BooleanStruct<T> :
    T extends any[] ? ArrayStruct<T> | TupleStruct<T> :
    T extends { type: string } ? SubTypeStruct<T> :
    T extends { [K in keyof T]: any } ? ObjectStruct<T> :
    never

type ElementOf<T extends Array<any>> = T extends Array<infer E> ? E : never

const structs = {
    null: (): NullStruct => ['null'],
    string: <T extends string>(defaultValue?: T): StringStruct<T> => ['string', defaultValue],
    number: <T extends number>(defaultValue?: T): NumberStruct<T> => ['number', defaultValue],
    integer: <T extends number>(defaultValue?: T): IntegerStruct<T> => ['integer', defaultValue],
    boolean: <T extends boolean>(defaultValue?: T): BooleanStruct<T> => ['boolean', defaultValue],
    tuple: <T extends [...any[]]>(elements: TupleStruct<T>[1], defaultValue?: T): TupleStruct<T> => ['tuple', elements, defaultValue],
    array: <T extends any[]>(elements: ParseStruct<T[keyof T]>, defaultValue?: ElementOf<T>[]): ArrayStruct<T> => ['array', elements, defaultValue],
    subType: <T extends { type: string }>(subTypes: SubTypeStruct<T>[1], defaultValue?: T): SubTypeStruct<T> => ['subtype', subTypes, defaultValue],
    object: <T>(props: ObjectStruct<T>[1], defaultValue?: T): ObjectStruct<T> => ['object', props, defaultValue],
}

export type StructDefinition<T> = { struct: ParseStruct<T>, parse: (value: unknown, inputName: string) => ReturnType<typeof parseUnknownValue<T>> }

export function defineStruct<T>(cb: ParseStruct<T> | ((s: typeof structs) => ParseStruct<T>)) {
    const struct = typeof cb === 'function' ? cb(structs) : cb
    return {
        struct,
        parse: (value: unknown, inputName: string) => parseUnknownValue(struct, value, inputName),
    }
}

function parse<T>(struct: ParseStruct<T>, value: unknown, path: string, warnings: string[], errors: string[]): unknown {
    switch (struct[0]) {
        case 'null':
            if (value === null) return null
            errors.push(`${path} is not null`)
            return undefined
        case 'string':
            if (typeof value === 'string') return value
            else if (struct[1] !== undefined) {
                warnings.push(`${path} is not a string; default value of ${JSON.stringify(struct[1])} will be used`)
                return struct[1]
            }
            errors.push(`${path} is not a string`)
            return undefined
        case 'number':
            if (typeof value === 'number') return value
            else if (struct[1] !== undefined) {
                warnings.push(`${path} is not a number; default value of ${JSON.stringify(struct[1])} will be used`)
                return struct[1]
            }
            errors.push(`${path} is not a number`)
            return undefined
        case 'integer':
            if (typeof value === 'number') {
                if (Math.round(value) !== value) {
                    errors.push(`${path} is a number but not an integer`)
                    return undefined
                }
                return value
            }
            else if (struct[1] !== undefined) {
                warnings.push(`${path} is not a number; default value of ${JSON.stringify(struct[1])} will be used`)
                return struct[1]
            }
            errors.push(`${path} is not a integer`)
            return undefined
        case 'boolean':
            if (typeof value === 'boolean') return value
            else if (struct[1] !== undefined) {
                warnings.push(`${path} is not a boolean; default value of ${struct[1]} will be used`)
                return struct[1]
            }
            errors.push(`${path} is not a boolean`)
            return undefined
        case 'tuple':
            if (Array.isArray(value)) {
                const childWarnings: string[] = []
                const childErrors: string[] = []
                const childValues: unknown[] = []
                for (let i = 0; i < struct[1].length; i++) {
                    const c = parse<any>(struct[1][i], value[i], `${path}[${i}]`, childWarnings, childErrors)
                    childValues.push(c)
                }
                if (!childErrors.length) {
                    warnings.push(...childWarnings)
                    return childValues
                }
                warnings.push(...childWarnings)
                errors.push(...childErrors)
                return undefined
            } else if (struct[2] !== undefined) {
                warnings.push(`${path} is not an array; default value of ${JSON.stringify(struct[2])} will be used`)
                return struct[2]
            }
            errors.push(`${path} is not an array`)
            return undefined
        case 'array':
            if (Array.isArray(value)) {
                const childWarnings: string[] = []
                const childErrors: string[] = []
                const childValues: unknown[] = []
                for (let i = 0; i < value.length; i++) {
                    const c = parse(struct[1], value[i], `${path}[${i}]`, childWarnings, childErrors)
                    childValues.push(c)
                }
                if (!childErrors.length) {
                    warnings.push(...childWarnings)
                    return childValues
                }
                warnings.push(...childWarnings)
                errors.push(...childErrors)
                return undefined
            } else if (struct[2] !== undefined) {
                warnings.push(`${path} is not an array; default value of ${JSON.stringify(struct[2])} will be used`)
                return struct[2]
            }
            errors.push(`${path} is not an array`)
            return undefined
    }
}

function parseUnknownValue<T>(struct: ParseStruct<T>, value: unknown, inputName: string): { success: true, value: T, warnings: string[], errors?: undefined } | { success: false, value?: undefined, warnings: string[], errors: string[] } {
    const warnings: string[] = []
    const errors: string[] = []
    const result = parse(struct, value, inputName, warnings, errors)
    if (errors.length) return { success: false, warnings, errors }
    return { success: true, value: result as T, warnings }
}
