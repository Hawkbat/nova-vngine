
export function immAppend<T>(arr: T[], ...values: T[]): T[] {
    return arr.concat(values)
}

export function immPrepend<T>(arr: T[], ...values: T[]): T[] {
    return values.concat(arr)
}

export function immReplaceAt<T>(arr: T[], index: number, ...values: T[]): T[] {
    return arr.slice(0, index).concat(values).concat(arr.slice(index + values.length))
}

export function immRemoveAt<T>(arr: T[], index: number, count: number = 1): T[] {
    return arr.slice(0, index).concat(arr.slice(index + count))
}

export function immReplaceBy<T>(arr: T[], getKey: (value: T) => unknown, value: T): T[] {
    const key = getKey(value)
    return arr.map(v => getKey(v) === key ? value : v)
}

export function immReplaceWhere<T>(arr: T[], filter: (value: T) => boolean, setter: (value: T) => T): T[] {
    return arr.map(v => filter(v) ? setter(v) : v)
}

export function keepWhile<T>(arr: T[], shouldKeep: (value: T, i: number, arr: T[]) => boolean): T[] {
    const endIndex = arr.findIndex((a, i, arr) => !shouldKeep(a, i, arr))
    if (endIndex < 0) return arr.slice()
    return arr.slice(0, endIndex)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function immSet<T extends Record<string, any>, K extends keyof T>(obj: T, key: K, value: T[K]): T {
    return { ...obj, [key]: value }
}

export function deepDiff<T>(a: T, b: T, path: string, diffs: [path: string, before: unknown, after: unknown][] = []) {
    if (a !== b) {
        diffs.push([path, a, b])
    }
    if (Array.isArray(a) && Array.isArray(b)) {
        deepDiff(a.length, b.length, `${path}.length`, diffs)
        for (let i = 0; i < Math.max(a.length, b.length); i++) {
            deepDiff(a[i], b[i], `${path}[${String(i)}]`, diffs)
        }
    } else if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
        for (const k in a) {
            deepDiff(a[k], b[k], `${path}.${k}`, diffs)
        }
        for (const k in b) {
            if (k in a) continue
            deepDiff(a[k], b[k], `${path}.${k}`, diffs)
        }
    }
    return diffs
}
