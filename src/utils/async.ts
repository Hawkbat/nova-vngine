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

export async function loadImage(src: string, image = new Image()) {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
        image.onload = () => {
            resolve(image)
        }
        image.onerror = (event: Event | string) => {
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            reject(event instanceof ErrorEvent ? event.error : event)
        }
        image.src = src
        return image
    })
}

export async function loadAudio(src: string, audio = new Audio()) {
    return await new Promise<HTMLAudioElement>((resolve, reject) => {
        audio.onload = () => {
            resolve(audio)
        }
        audio.onerror = (event: Event | string) => {
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            reject(event instanceof ErrorEvent ? event.error : event)
        }
        audio.src = src
        return audio
    })
}

export async function loadFileDataURLAsync(file: File) {
    return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.addEventListener('error', () => reader.error ? reject(reader.error) : void 0)
        reader.addEventListener('load', () => typeof reader.result === 'string' ? resolve(reader.result) : void 0)
        reader.readAsDataURL(file)
    })
}
