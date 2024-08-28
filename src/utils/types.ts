
export type Branded<T extends string | number | boolean, B extends string> = T & { $brand: B }

export type Unbranded<T extends string | number | boolean> = T extends Branded<infer V, infer _B> ? Omit<V, '$brand'> : never

export type Brand<T extends Branded<string | number | boolean, string>> = T extends Branded<infer _, infer B> ? B : never

export type Widen<T> =
    T extends string ? string :
    T extends number ? number :
    T extends boolean ? boolean :
    { -readonly [K in keyof T]: Widen<T[K]> }

export type DeepReadonly<T> = { readonly [P in keyof T]: DeepReadonly<T[P]> }
export type Writable<T> = { -readonly [P in keyof T]: T[P] }
export type DeepWriteable<T> = { -readonly [P in keyof T]: DeepWriteable<T[P]> }

export type OmitUndefined<T> = { [K in keyof T as undefined extends T[K] ? never : K]: T[K] }

export function hintTuple<T extends unknown[]>(...args: T): T {
    return args
}

export function hintWide<T>(value: T): Widen<T> {
    return value as Widen<T>
}

export function hintDeepReadonly<T>(value: T): DeepReadonly<T> {
    return value as DeepReadonly<T>
}

export function hintDeepWritable<T>(value: T): DeepWriteable<T> {
    return value as DeepWriteable<T>
}

export function assertExhaustive(value: never, msg: string): never {
    throw new Error(msg)
}

export function inlineThrow(err: Error): never {
    throw err
}
