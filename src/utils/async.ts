import { hintTuple } from './types'

export async function wait(ms: number) {
    if (ms <= 0) return
    await new Promise<void>((resolve) => {
        setTimeout(resolve, ms)
    })
}

export async function awaitAllMap<T extends Record<string, Promise<unknown>>>(map: T) {
    return Object.fromEntries(await Promise.all(Object.entries(map).map(async ([k, v]) => hintTuple(k, await v)))) as { [K in keyof T]: Awaited<T[K]> }
}

export interface ExposedPromise<T> {
    promise: Promise<T>
    resolve: (t: T) => void
    reject: (err?: unknown) => void
}

export function createExposedPromise<T = void>(): ExposedPromise<T> {
    let resolve: (t: T) => void
    let reject: (err?: unknown) => void
    const promise = new Promise<T>((res, rej) => {
        resolve = res
        reject = rej
    })
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return { promise, resolve: resolve!, reject: reject! }
}
