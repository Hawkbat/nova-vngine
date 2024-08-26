
export type Branded<T, U> = T & { [Symbol.species]: U }

export type Widen<T> =
    T extends string ? string :
    T extends number ? number :
    T extends boolean ? boolean :
    { -readonly [K in keyof T]: Widen<T[K]> }

export type DeepReadonly<T> = { readonly [P in keyof T]: DeepReadonly<T[P]> }
export type Writable<T> = { -readonly [P in keyof T]: T[P] }
export type DeepWriteable<T> = { -readonly [P in keyof T]: DeepWriteable<T[P]> }

export function hintTypeTuple<T extends unknown[]>(...args: T): T {
    return args
}

export function hintTypeWide<T>(value: T): Widen<T> {
    return value as Widen<T>
}

export function hintTypeDeepReadonly<T>(value: T): DeepReadonly<T> {
    return value as DeepReadonly<T>
}

export function hintTypeDeepWritable<T>(value: T): DeepWriteable<T> {
    return value as DeepWriteable<T>
}

export function assertExhaustive(value: never, msg: string): never {
    throw new Error(msg)
}

export function inlineThrow(err: Error): never {
    throw err
}
