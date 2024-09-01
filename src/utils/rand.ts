import { throwIfNull } from './guard'
import { remap } from './math'

const INT32_MIN = -2147483648
const INT32_MAX = 2147483647

function xorShift(value: number): number {
    value ^= value << 13
    value ^= value >> 17
    value ^= value << 5
    return value
}

export type RandState = [type: 'xorshift32', state: number]
export type RandResult<T> = [state: RandState, result: T]

function advance(state: RandState): RandState {
    return ['xorshift32', xorShift(state[1])]
}

export function randSeedRandom(): RandState {
    return randSeed(Math.floor(remap(Math.random(), 0, 1, INT32_MIN, INT32_MAX)))
}

export function randSeed(seed: number): RandState {
    return ['xorshift32', seed === 0 ? 1 : seed]
}

export function randFloat(state: RandState, min: number, max: number): RandResult<number> {
    state = advance(state)
    const result = remap(state[1], INT32_MIN, INT32_MAX, min, max)
    return [state, result]
}

export function randInt(state: RandState, min: number, max: number): RandResult<number> {
    state = advance(state)
    const result = Math.floor(remap(state[1], INT32_MIN, INT32_MAX, min, max + 1))
    return [state, result]
}

export function randItem<T>(state: RandState, array: T[]): RandResult<T> {
    const [newState, index] = randInt(state, 0, array.length - 1)
    const result = throwIfNull(array[index])
    return [newState, result]
}

export function randRoll(state: RandState, chance: number): RandResult<boolean> {
    const [newState, value] = randFloat(state, 0, 1)
    const result = value < chance
    return [newState, result]
}

export function randString(state: RandState, charSet: string, length: number): RandResult<string> {
    let result = ''
    let index = -1
    for (let i = 0; i < length; i++) {
        [state, index] = randInt(state, 0, charSet.length - 1)
        result += throwIfNull(charSet[index])
    }
    return [state, result]
}

const ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export function randID(state: RandState): RandResult<string> {
    return randString(state, ID_CHARS, 8)
}

export function uncheckedRandID(): string {
    return randID(randSeedRandom())[1]
}
