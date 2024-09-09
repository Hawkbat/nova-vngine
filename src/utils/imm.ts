
export function immAppend<T>(arr: T[], ...values: T[]): T[] {
    return arr.concat(values)
}

export function immPrepend<T>(arr: T[], ...values: T[]): T[] {
    return values.concat(arr)
}

export function immReplaceAt<T>(arr: T[], index: number, ...values: T[]): T[] {
    return arr.slice(0, index).concat(values).concat(arr.slice(index + values.length))
}

export function immInsertAt<T>(arr: T[], index: number, ...values: T[]): T[] {
    return arr.slice(0, index).concat(values).concat(arr.slice(index))
}

export function immRemoveAt<T>(arr: T[], index: number, count: number = 1): T[] {
    return arr.slice(0, index).concat(arr.slice(index + count))
}

export function immRemoveWhere<T>(arr: T[], where: (value: T) => boolean): T[] {
    return arr.filter(v => !where(v))
}

export function immReplaceBy<T>(arr: T[], getKey: (value: T) => unknown, value: T): T[] {
    const key = getKey(value)
    return arr.map(v => getKey(v) === key ? value : v)
}

export function immReplaceWhere<T>(arr: T[], where: (value: T) => boolean, setter: (value: T) => T): T[] {
    return arr.map(v => where(v) ? setter(v) : v)
}

export function immKeepWhile<T>(arr: T[], shouldKeep: (value: T, i: number, arr: T[]) => boolean): T[] {
    const endIndex = arr.findIndex((a, i, arr) => !shouldKeep(a, i, arr))
    if (endIndex < 0) return arr.slice()
    return arr.slice(0, endIndex)
}

export function immPadTo<T>(arr: T[], length: number, getPad: (i: number) => T) {
    if (arr.length >= length) return arr
    return arr.concat(new Array(length - arr.length).fill(null).map((_, i) => getPad(arr.length + i)))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function immSet<T extends Record<string, any>, K extends keyof T>(obj: T, key: K, value: T[K]): T {
    return { ...obj, [key]: value }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function immSetProps<T extends Record<string, any>>(obj: T, values: Partial<T>): T {
    return { ...obj, ...values }
}

export function shallowEquals<T>(a: T, b: T): boolean {
    if (a === b) return true
    if (typeof a !== typeof b) return false
    if (a === null || b === null) return a === b
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false
        }
        return true
    }
    if (typeof a === 'object' && typeof b === 'object') {
        for (const [k, v] of Object.entries(a)) {
            if (b[k as keyof T] !== v) return false
        }
        for (const [k, v] of Object.entries(b)) {
            if (a[k as keyof T] !== v) return false
        }
        return true
    }
    return false
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
