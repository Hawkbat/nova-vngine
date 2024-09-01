
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ElementValuesOfArrayTuple<T extends [...(any[])[]]> = {
    [K in keyof T]: T[K][number]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function forEachMultiple<T extends [...(any[])[]]>(arrays: T, callback: (i: number, ...values: ElementValuesOfArrayTuple<T>) => void) {
    const maxLength = arrays.reduce((p, c) => Math.max(p, c.length), 0)
    for (let i = 0; i < maxLength; i++) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        const values = arrays.map(a => a[i])
        callback(i, ...values as ElementValuesOfArrayTuple<T>)
    }
}

export function arrayHead<T>(array: T[]): T | null {
    return array[0] ?? null
}

export function arrayTail<T>(array: T[]): T | null {
    return array[array.length - 1] ?? null
}
