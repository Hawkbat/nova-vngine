/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { arrayHead } from './array'
import { hintTuple } from './types'

export function throwIfNull<T>(value: T): NonNullable<T> {
    if (value === null || value === undefined) throw new Error('Value was null or undefined')
    return value
}

export function isClass<T>(value: unknown, constructor: { new (...args: unknown[]): T }): value is T {
    return value instanceof constructor
}

export const getClassFilter = <T>(constructor: { new (...args: unknown[]): T }) => (value: unknown) => isClass(value, constructor)

export const existsFilter = <T>(value: T | null | undefined): value is NonNullable<T> => {
    return value !== null && value !== undefined
}

export interface ParseContext {
    path: string
    warnings: string[]
    errors: string[]
}

export type ParseFunc<T> = (ctx: ParseContext, value: unknown, defaultValue?: T) => T

function parseNull(ctx: ParseContext, value: unknown): null {
    if (value === null) return null
    ctx.errors.push(`${ctx.path} is not null`)
    return null
}

function parseString(ctx: ParseContext, value: unknown, defaultValue?: string): string {
    if (typeof value === 'string') return value
    else if (defaultValue !== undefined) {
        ctx.warnings.push(`${ctx.path} is not a string; default value of ${JSON.stringify(defaultValue)} will be used`)
        return defaultValue
    }
    ctx.errors.push(`${ctx.path} is not a string`)
    return ''
}

function parseID<T extends string>(ctx: ParseContext, value: unknown, defaultValue?: T): T {
    return parseString(ctx, value, defaultValue) as T
}

function parseEnum<T extends string>(ctx: ParseContext, value: unknown, validValues: T[], defaultValue?: T): T {
    if (typeof value === 'string') {
        if (validValues.includes(value as T)) {
            return value as T
        } else {
            ctx.errors.push(`${ctx.path} is not a valid string enum value; it must be one of the following: ${validValues.map(v => JSON.stringify(v)).join(', ')}`)
            return arrayHead(validValues) ?? '' as T
        }
    } else if (defaultValue !== undefined) {
        ctx.warnings.push(`${ctx.path} is not a string; default value of ${JSON.stringify(defaultValue)} will be used`)
        return defaultValue
    }
    ctx.errors.push(`${ctx.path} is not a string`)
    return arrayHead(validValues) ?? '' as T
}

function parseNumber(ctx: ParseContext, value: unknown, defaultValue?: number): number {
    if (typeof value === 'number') return value
    else if (defaultValue !== undefined) {
        ctx.warnings.push(`${ctx.path} is not a number; default value of ${JSON.stringify(defaultValue)} will be used`)
        return defaultValue
    }
    ctx.errors.push(`${ctx.path} is not a number`)
    return 0
}

function parseInteger(ctx: ParseContext, value: unknown, defaultValue?: number): number {
    if (typeof value === 'number') {
        if (Math.round(value) !== value) {
            ctx.errors.push(`${ctx.path} is a number but not an integer`)
            return 0
        }
        return value
    }
    else if (defaultValue !== undefined) {
        ctx.warnings.push(`${ctx.path} is not an integer; default value of ${JSON.stringify(defaultValue)} will be used`)
        return defaultValue
    }
    ctx.errors.push(`${ctx.path} is not an integer`)
    return 0
}

function parseBoolean(ctx: ParseContext, value: unknown, defaultValue?: boolean): boolean {
    if (typeof value === 'boolean') return value
    else if (defaultValue !== undefined) {
        ctx.warnings.push(`${ctx.path} is not a boolean; default value of ${JSON.stringify(defaultValue)} will be used`)
        return defaultValue
    }
    ctx.errors.push(`${ctx.path} is not a boolean`)
    return false
}

function parseTuple<T extends [...any[]]>(ctx: ParseContext, value: unknown, subParsers: { [I in Exclude<keyof T, keyof any[]>]: ParseFunc<T[I]> } & { length: T['length'] }, defaultValue?: T): T {
    if (Array.isArray(value)) {
        if (value.length > subParsers.length) {
            ctx.warnings.push(`${ctx.path} has length ${String(value.length)}, not ${String(subParsers.length)}. Excess items will be truncated`)
        }
        return (subParsers as ParseFunc<any>[]).map((cb, i) => cb({ ...ctx, path: `${ctx.path}[${String(i)}]` }, value[i], defaultValue?.[i])) as T
    }
    else if (defaultValue !== undefined) {
        ctx.warnings.push(`${ctx.path} is not a tuple; default value of ${JSON.stringify(defaultValue)} will be used`)
        return defaultValue
    }
    ctx.errors.push(`${ctx.path} is not a tuple`)
    return (subParsers as ParseFunc<any>[]).map((cb, i) => cb({ ...ctx, path: `${ctx.path}[${String(i)}]` }, undefined)) as T
}

function parseArray<T extends any[]>(ctx: ParseContext, value: unknown, subParser: ParseFunc<T[Extract<keyof T, number>]>, defaultValue?: T): T {
    if (Array.isArray(value)) {
        return value.map((v, i) => subParser({ ...ctx, path: `${ctx.path}[${String(i)}]` }, v, undefined)) as T
    }
    else if (defaultValue !== undefined) {
        ctx.warnings.push(`${ctx.path} is not an array; default value of ${JSON.stringify(defaultValue)} will be used`)
        return defaultValue
    }
    ctx.errors.push(`${ctx.path} is not an array`)
    return [] as unknown as T
}

function parseObject<T>(ctx: ParseContext, value: unknown, subParsers: { [K in keyof T]: ParseFunc<T[K]> }, defaultValue?: T): T {
    if (typeof value === 'object' && value !== null) {
        return Object.fromEntries(Object.entries<any>(subParsers).map(([k, cb]) => hintTuple(k, cb({ ...ctx, path: `${ctx.path}.${k}` }, (value as any)[k], (defaultValue as any)?.[k])))) as T
    }
    else if (defaultValue !== undefined) {
        ctx.warnings.push(`${ctx.path} is not an object; default value of ${JSON.stringify(defaultValue)} will be used`)
        return defaultValue
    }
    ctx.errors.push(`${ctx.path} is not an object`)
    return Object.fromEntries(Object.entries<any>(subParsers).map(([k, cb]) => hintTuple(k, cb({ ...ctx, path: `${ctx.path}.${k}` }, undefined)))) as T
}

function parseTypedObject<T extends { type: string }, C extends keyof T>(ctx: ParseContext, value: unknown, commonParsers: { [K in C]: ParseFunc<T[K]> }, typeParsers: { [K in T['type']]: { [L in keyof Omit<Extract<T, { type: K }>, 'type' | C>]: ParseFunc<Omit<Extract<T, { type: K }>, 'type' | C>[L]> } }, defaultValue?: T): T {
    if (typeof value === 'object' && value !== null && 'type' in value && typeof value.type === 'string') {
        if (value.type in typeParsers) {
            const commonParserResult = Object.fromEntries(Object.entries<any>(commonParsers).map(([k, cb]) => hintTuple(k, cb({ ...ctx, path: `${ctx.path}.${k}` }, (value as any)[k], (defaultValue as any)?.[k]))))
            const typeParserMap = typeParsers[value.type as keyof typeof typeParsers]
            const typeParserResult = Object.fromEntries(Object.entries<any>(typeParserMap).map(([k, cb]) => hintTuple(k, cb({ ...ctx, path: `${ctx.path}.${k}` }, (value as any)[k], (defaultValue as any)?.[k]))))
            return { type: value.type, ...commonParserResult, ...typeParserResult } as unknown as T
        } else {
            ctx.errors.push(`${ctx.path}.type is not a valid type; it must be one of the following: ${Object.keys(typeParsers).map(k => JSON.stringify(k)).join(', ')}`)
            return (defaultValue ?? { type: '' }) as T
        }
    }
    else if (defaultValue !== undefined) {
        ctx.warnings.push(`${ctx.path} is not an object with a string property named 'type'; default value of ${JSON.stringify(defaultValue)} will be used`)
        return defaultValue
    }
    ctx.errors.push(`${ctx.path} is not an object with a string property named 'type'`)
    return { type: '' } as T
}

function parseEither<A, B>(ctx: ParseContext, value: unknown, leftParser: ParseFunc<A>, rightParser: ParseFunc<B>, defaultValue?: A | B): A | B {
    const leftResults = tryParseValue(value, ctx.path, leftParser)
    if (leftResults.success) {
        ctx.warnings.push(...leftResults.ctx.warnings)
        return leftResults.value
    }
    const rightResults = tryParseValue(value, ctx.path, rightParser)
    if (rightResults.success) {
        ctx.warnings.push(...rightResults.ctx.warnings)
        return rightResults.value
    }
    if (defaultValue !== undefined) {
        ctx.warnings.push(`${ctx.path} is not either of the expected types; default value of ${JSON.stringify(defaultValue)} will be used`)
        return defaultValue
    }
    ctx.errors.push(`${ctx.path} is not either of the expected types`, ...leftResults.ctx.errors, ...rightResults.ctx.errors)
    ctx.warnings.push(...leftResults.ctx.warnings, ...rightResults.ctx.warnings)
    return null as A | B
}

export const parsers = {
    null: parseNull,
    string: parseString,
    id: parseID,
    enum: parseEnum,
    number: parseNumber,
    integer: parseInteger,
    boolean: parseBoolean,
    tuple: parseTuple,
    array: parseArray,
    object: parseObject,
    typed: parseTypedObject,
    either: parseEither,
}

export function defineParser<T>(parser: ParseFunc<T>) {
    return parser
}

export function tryParseValue<T>(value: unknown, inputName: string, parser: ParseFunc<T>): { success: true, value: T, ctx: ParseContext } | { success: false, value?: undefined, ctx: ParseContext } {
    const ctx: ParseContext = { path: inputName, warnings: [], errors: [] }
    const result = parser(ctx, value)
    if (ctx.errors.length) return { success: false, ctx }
    return { success: true, value: result, ctx }
}

export function tryParseJson<T>(json: string, inputName: string, parser: ParseFunc<T>) {
    try {
        const value: unknown = JSON.parse(json)
        return tryParseValue(value, inputName, parser)
    } catch (err) {
        console.error(err)
        return tryParseValue(undefined, inputName, parser)
    }
}
