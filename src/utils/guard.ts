
export function throwIfNull<T>(value: T): NonNullable<T> {
    if (value === null || value === undefined) throw new Error(`Value is not defined`)
    return value
}
