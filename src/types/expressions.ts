import { arrayHead, forEachMultiple } from '../utils/array'
import type { ParseFunc } from '../utils/guard'
import { defineParser, parsers as $, throwIfNull } from '../utils/guard'
import type { OmitUndefined } from '../utils/types'
import { assertExhaustive, hintTuple, inlineThrow } from '../utils/types'
import type { AnyVariableDefinition, BackdropDefinition, BackdropID, ChapterDefinition, ChapterID, CharacterDefinition, CharacterID, MacroDefinition, MacroID, PortraitDefinition, PortraitID, SceneDefinition, SceneID, SongDefinition, SongID, SoundDefinition, SoundID, StoryDefinition, StoryID, VariableID } from './project'

export type LocationPositionValue = 'auto' | 'left' | 'center' | 'right' | number
export type LocationHeightValue = 'auto' | 'full' | 'knees' | 'thighs' | 'waist' | 'shoulder' | 'head' | number
export type LocationScaleValue = 'auto' | 'near' | 'middle' | 'far' | number

export interface LocationValue {
    position: LocationPositionValue
    height: LocationHeightValue
    scale: LocationScaleValue
}

export interface ExprArgDefinition {
    label: string
    type: ExprPrimitiveValueType
}

export interface ExprParamDefinition {
    label: string
    types: ExprValueType[] | null
}

export interface ExprChildParamDefinition {
    label: string
    types: ExprValueType[] | null
}

export interface ExprDefinition {
    type: ExprType
    label: string
    returnTypes: ExprValueType[] | null
    args: ExprArgDefinition[]
    params: ExprParamDefinition[]
    children: ExprChildParamDefinition[]
}

interface PartialExprDefinition {
    label: string
    returnTypes: ExprValueType[] | null
    args?: ExprArgDefinition[]
    params?: ExprParamDefinition[]
    children?: ExprChildParamDefinition[]
}

function validateExprDefinitions<T extends Record<string, PartialExprDefinition>>(defs: T): T {
    return defs
}

const EXPRS = validateExprDefinitions({
    unset: { label: 'Unset', returnTypes: null },

    list: { label: 'List', returnTypes: null, children: [{ label: 'Item', types: null }] },

    string: { label: 'Text', args: [{ label: 'Value', type: 'string' }], returnTypes: ['string'] },
    number: { label: 'Number', args: [{ label: 'Value', type: 'number' }], returnTypes: ['number'] },
    integer: { label: 'Integer', args: [{ label: 'Value', type: 'integer' }], returnTypes: ['integer'] },
    boolean: { label: 'Flag', args: [{ label: 'Value', type: 'boolean' }], returnTypes: ['boolean'] },
    location: { label: 'Location', args: [{ label: 'Value', type: 'location' }], returnTypes: ['location'] },

    story: { label: 'Story', args: [{ label: 'Value', type: 'story' }], returnTypes: ['story'] },
    chapter: { label: 'Chapter', args: [{ label: 'Value', type: 'chapter' }], returnTypes: ['chapter'] },
    scene: { label: 'Scene', args: [{ label: 'Value', type: 'scene' }], returnTypes: ['scene'] },
    character: { label: 'Character', args: [{ label: 'Value', type: 'character' }], returnTypes: ['character'] },
    portrait: { label: 'Portrait', args: [{ label: 'Value', type: 'portrait' }], returnTypes: ['portrait'] },
    backdrop: { label: 'Backdrop', args: [{ label: 'Value', type: 'backdrop' }], returnTypes: ['backdrop'] },
    song: { label: 'Song', args: [{ label: 'Value', type: 'song' }], returnTypes: ['song'] },
    sound: { label: 'Sound', args: [{ label: 'Value', type: 'sound' }], returnTypes: ['sound'] },
    variable: { label: 'Variable', args: [{ label: 'Value', type: 'variable' }], returnTypes: ['variable'] },
    characterVariable: { label: 'Character Variable', args: [{ label: 'Value', type: 'variable' }], params: [{ label: 'Character', types: ['character'] }], returnTypes: ['variable'] },
    macro: { label: 'Macro', args: [{ label: 'Macro', type: 'macro' }], returnTypes: ['macro'] },

    and: { label: 'And', params: [{ label: 'Left', types: ['boolean'] }, { label: 'Right', types: ['boolean'] }], returnTypes: ['boolean'] },
    or: { label: 'And', params: [{ label: 'Left', types: ['boolean'] }, { label: 'Right', types: ['boolean'] }], returnTypes: ['boolean'] },
    not: { label: 'Not', params: [{ label: 'Value', types: ['boolean'] }], returnTypes: ['boolean'] },

    add: { label: 'Add', params: [{ label: 'Left', types: ['number', 'integer'] }, { label: 'Right', types: ['number', 'integer'] }], returnTypes: ['number', 'integer'] },
    subtract: { label: 'Subtract', params: [{ label: 'Left', types: ['number', 'integer'] }, { label: 'Right', types: ['number', 'integer'] }], returnTypes: ['number', 'integer'] },
    multiply: { label: 'Multiply', params: [{ label: 'Left', types: ['number', 'integer'] }, { label: 'Right', types: ['number', 'integer'] }], returnTypes: ['number', 'integer'] },
    divide: { label: 'Divide', params: [{ label: 'Left', types: ['number', 'integer'] }, { label: 'Right', types: ['number', 'integer'] }], returnTypes: ['number', 'integer'] },
    modulo: { label: 'Remainder', params: [{ label: 'Left', types: ['number', 'integer'] }, { label: 'Right', types: ['number', 'integer'] }], returnTypes: ['number', 'integer'] },

    round: { label: 'Round', params: [{ label: 'Number', types: ['number', 'integer'] }], returnTypes: ['integer'] },
    roundUp: { label: 'Round Up', params: [{ label: 'Number', types: ['number', 'integer'] }], returnTypes: ['integer'] },
    roundDown: { label: 'Round Down', params: [{ label: 'Number', types: ['number', 'integer'] }], returnTypes: ['integer'] },

    randomFloat: { label: 'Random Number', params: [{ label: 'Min', types: ['number', 'integer'] }, { label: 'Max', types: ['number', 'integer'] }], returnTypes: ['number'] },
    randomInt: { label: 'Random Integer', params: [{ label: 'Min', types: ['integer'] }, { label: 'Max', types: ['integer'] }], returnTypes: ['integer'] },
    randomItem: { label: 'Random List Item', params: [{ label: 'List', types: null }], returnTypes: null },

    lowerCase: { label: 'To Lowercase', params: [{ label: 'Text', types: ['string'] }], returnTypes: ['string'] },
    upperCase: { label: 'To Uppercase', params: [{ label: 'Text', types: ['string'] }], returnTypes: ['string'] },

    format: { label: 'Formatted Text', returnTypes: ['string'], children: [{ label: 'Item', types: ['string'] }] },

    equal: { label: 'Equal To', params: [{ label: 'Left', types: null }, { label: 'Right', types: null }], returnTypes: ['boolean'] },
    notEqual: { label: 'Not Equal To', params: [{ label: 'Left', types: null }, { label: 'Right', types: null }], returnTypes: ['boolean'] },
    lessThan: { label: 'Less Than', params: [{ label: 'Left', types: ['number'] }, { label: 'Right', types: ['number'] }], returnTypes: ['boolean'] },
    lessThanOrEqual: { label: 'Less Than Or Equal To', params: [{ label: 'Left', types: ['number'] }, { label: 'Right', types: ['number'] }], returnTypes: ['boolean'] },
    greaterThan: { label: 'Greater Than', params: [{ label: 'Left', types: ['number'] }, { label: 'Right', types: ['number'] }], returnTypes: ['boolean'] },
    greaterThanOrEqual: { label: 'Greater Than Or Equal To', params: [{ label: 'Left', types: ['number'] }, { label: 'Right', types: ['number'] }], returnTypes: ['boolean'] },

    pick: { label: 'Either-Or', params: [{ label: 'If', types: ['boolean'] }, { label: 'Then', types: null }, { label: 'Else', types: null }], returnTypes: null },
    switch: { label: 'One-Of', params: [{ label: 'Else', types: null }], returnTypes: null, children: [{ label: 'If', types: ['boolean'] }, { label: 'Then', types: null }] },
} as const)

type ExprMap = typeof EXPRS

export const EXPR_DEFINITION_MAP: Record<ExprType, PartialExprDefinition> = EXPRS

export const EXPR_DEFINITIONS: ExprDefinition[] = Object.entries(EXPRS).map(([k, v]) => ({ type: k as ExprType, args: [], params: [], children: [], ...v }))

type ArgValues<T extends [...ExprArgDefinition[]]> = T extends [...ExprArgDefinition[]] ? { [I in keyof T]: ExprPrimitiveRawValueOfType<T[I]['type']> } & { length: T['length'] } : undefined
type ParamValues<T extends [...ExprParamDefinition[]]> = T extends [...ExprParamDefinition[]] ? { [I in keyof T]: AnyExpr } & { length: T['length'] } : undefined
type ChildValues<T extends [...ExprChildParamDefinition[]]> = T extends [...ExprChildParamDefinition[]] ? ({ [I in keyof T]: AnyExpr } & { length: T['length'] })[] : undefined

type ExprOfTypeFromDef<T extends ExprType, D extends PartialExprDefinition> = OmitUndefined<{
    type: T
    args: D['args'] extends undefined ? undefined : ArgValues<Exclude<D['args'], undefined>>
    params: D['params'] extends undefined ? undefined : ParamValues<Exclude<D['params'], undefined>>
    children: D['children'] extends undefined ? undefined : ChildValues<Exclude<D['children'], undefined>>
}>

export type ExprType = keyof ExprMap
export type ExprOfType<T extends ExprType> = T extends ExprType ? ExprOfTypeFromDef<T, ExprMap[T]> : never
export type AnyExpr = ExprOfType<ExprType>

type ExprPrimitiveValueTypeMap = {
    string: string
    number: number
    integer: number
    boolean: boolean
    story: StoryID
    chapter: ChapterID
    scene: SceneID
    character: CharacterID
    portrait: PortraitID
    backdrop: BackdropID
    song: SongID
    sound: SoundID
    variable: VariableID
    macro: MacroID
    location: LocationValue
}

const PRIMITIVE_DEFAULT_VALUES: ExprPrimitiveValueTypeMap = {
    string: '',
    number: 0,
    integer: 0,
    boolean: false,
    story: '' as StoryID,
    chapter: '' as ChapterID,
    scene: '' as SceneID,
    character: '' as CharacterID,
    portrait: '' as PortraitID,
    backdrop: '' as BackdropID,
    song: '' as SongID,
    sound: '' as SoundID,
    variable: '' as VariableID,
    macro: '' as MacroID,
    location: { position: 'auto', height: 'auto', scale: 'auto' },
}

export const EXPR_VALUE_TYPES = [...Object.keys(PRIMITIVE_DEFAULT_VALUES), 'list'] as ExprValueType[]

function getContextualDefaultPrimitiveValue<T extends ExprPrimitiveValueType>(type: T, ctx: ExprContext): ExprPrimitiveRawValueOfType<T> {
    if (type in ctx.suggestions) {
        return (arrayHead(ctx.suggestions[type as keyof ExprContext['suggestions']]() as unknown[]) ?? '') as ExprPrimitiveRawValueOfType<T>
    }
    return PRIMITIVE_DEFAULT_VALUES[type] as ExprPrimitiveRawValueOfType<T>
}

export type ExprPrimitiveRawValueOfType<T extends ExprPrimitiveValueType> = ExprPrimitiveValueTypeMap[T]

export type ExprPrimitiveValueType = keyof ExprPrimitiveValueTypeMap
export type ExprPrimitiveValue<T extends ExprPrimitiveValueType> = { type: T, value: ExprPrimitiveRawValueOfType<T> }
export type ExprPrimitiveValueOfType<T extends ExprPrimitiveValueType> = T extends ExprPrimitiveValueType ? ExprPrimitiveValue<T> : never
export type AnyExprPrimitiveValue = ExprPrimitiveValueOfType<ExprPrimitiveValueType>

export type ExprListValueType = 'list'
export type ExprListValue = { type: 'list', value: AnyExprValue[] }

export type ExprValueType = ExprPrimitiveValueType | ExprListValueType
export type ExprValueOfType<T extends ExprValueType> = T extends ExprListValueType ? ExprListValue : T extends ExprPrimitiveValueType ? ExprPrimitiveValue<T> : never
export type AnyExprValue = AnyExprPrimitiveValue | ExprListValue

export type StringExpr = AnyExpr
export type NumberExpr = AnyExpr
export type IntegerExpr = AnyExpr
export type BooleanExpr = AnyExpr
export type StoryExpr = AnyExpr
export type ChapterExpr = AnyExpr
export type SceneExpr = AnyExpr
export type CharacterExpr = AnyExpr
export type PortraitExpr = AnyExpr
export type BackdropExpr = AnyExpr
export type SongExpr = AnyExpr
export type SoundExpr = AnyExpr
export type VariableExpr = AnyExpr
export type MacroExpr = AnyExpr
export type LocationExpr = AnyExpr
export type ListExpr = AnyExpr
export type ValueExpr = AnyExpr

export interface ExprContext {
    suggestions: {
        story: () => StoryID[]
        chapter: () => ChapterID[]
        scene: () => SceneID[]
        character: () => CharacterID[]
        portrait: () => PortraitID[]
        backdrop: () => BackdropID[]
        song: () => SongID[]
        sound: () => SoundID[]
        macro: () => MacroID[]
        variable: () => VariableID[]
    }
    resolvers: {
        story: (id: StoryID) => StoryDefinition | null
        chapter: (id: ChapterID) => ChapterDefinition | null
        scene: (id: SceneID) => SceneDefinition | null
        character: (id: CharacterID) => CharacterDefinition | null
        portrait: (id: PortraitID) => PortraitDefinition | null
        backdrop: (id: BackdropID) => BackdropDefinition | null
        song: (id: SongID) => SongDefinition | null
        sound: (id: SoundID) => SoundDefinition | null
        macro: (id: MacroID) => MacroDefinition | null
        variable: (id: VariableID) => AnyVariableDefinition | null
    }
    variables: {
        getValue: (id: VariableID) => AnyExprValue | null
        setValue: (id: VariableID, value: AnyExprValue) => void
        getCharacterValue: (id: VariableID, characterID: CharacterID) => AnyExprValue | null
        setCharacterValue: (id: VariableID, characterID: CharacterID, value: AnyExprValue) => void
    }
    random: {
        int: (min: number, max: number) => number
        float: (min: number, max: number) => number
    }
    scope: {
        character?: boolean | CharacterID
        scene?: boolean | SceneID
        macro?: boolean | MacroID
    }
}

export function isPrimitiveValueType(type: ExprValueType): type is ExprPrimitiveValueType {
    return type !== 'list'
}

export function isPrimitiveValue(value: AnyExprValue): value is AnyExprPrimitiveValue {
    return isPrimitiveValueType(value.type)
}

function resolveNumberOp(left: AnyExpr, right: AnyExpr, op: (a: number, b: number, isInt: boolean) => number, ctx: ExprContext): ExprValueOfType<'number'> | ExprValueOfType<'integer'> {
    let leftValue = resolveExpr(left, ctx)
    let rightValue = resolveExpr(right, ctx)
    const leftIntValue = tryCastExprValue(leftValue, 'integer', ctx)
    const rightIntValue = tryCastExprValue(rightValue, 'integer', ctx)
    if (leftIntValue && rightIntValue) {
        return { type: 'integer', value: op(leftIntValue.value, rightIntValue.value, true) }
    }
    const leftNumValue = tryCastExprValue(leftValue, 'number', ctx)
    const rightNumValue = tryCastExprValue(rightValue, 'number', ctx)
    if (leftNumValue && rightNumValue) {
        return { type: 'number', value: op(leftNumValue.value, rightNumValue.value, false) }
    }
    leftValue = castExprValue(leftValue, 'number', ctx)
    rightValue = castExprValue(rightValue, 'number', ctx)
    return { type: 'number', value: op(leftValue.value, rightValue.value, false) }
}

function resolveNumberComparison(left: AnyExpr, right: AnyExpr, op: (a: number, b: number) => boolean, ctx: ExprContext): ExprValueOfType<'boolean'> {
    return { type: 'boolean', value: op(resolveExprAs(left, 'number', ctx).value, resolveExprAs(right, 'number', ctx).value) }
}

export function resolveExprAs<T extends ExprValueType>(expr: AnyExpr, type: T, ctx: ExprContext): ExprValueOfType<T> {
    return castExprValue(resolveExpr(expr, ctx), type, ctx)
}

export function tryResolveExprAs<T extends ExprValueType>(expr: AnyExpr, type: T, ctx: ExprContext): ExprValueOfType<T> | null {
    try {
        return resolveExprAs(expr, type, ctx)
    } catch {
        return null
    }
}

export function resolveExpr(expr: AnyExpr, ctx: ExprContext): AnyExprValue {
    try {
        switch (expr.type) {
            case 'unset': throw new Error('Expression was not set or does not have a value.')
            case 'list': return { type: 'list', value: expr.children.map(([item]) => resolveExpr(item, ctx)) }
            case 'string': return { type: 'string', value: expr.args[0] }
            case 'number': return { type: 'number', value: expr.args[0] }
            case 'integer': return { type: 'integer', value: expr.args[0] }
            case 'boolean': return { type: 'boolean', value: expr.args[0] }
            case 'story': return { type: 'story', value: expr.args[0] }
            case 'chapter': return { type: 'chapter', value: expr.args[0] }
            case 'scene': return { type: 'scene', value: expr.args[0] }
            case 'variable': return { type: 'variable', value: expr.args[0] }
            case 'character': return { type: 'character', value: expr.args[0] }
            case 'portrait': return { type: 'portrait', value: expr.args[0] }
            case 'backdrop': return { type: 'backdrop', value: expr.args[0] }
            case 'song': return { type: 'song', value: expr.args[0] }
            case 'sound': return { type: 'sound', value: expr.args[0] }
            case 'macro': return { type: 'macro', value: expr.args[0] }
            case 'characterVariable': return throwIfNull(ctx.variables.getCharacterValue(expr.args[0], resolveExprAs(expr.params[0], 'character', ctx).value))
            case 'location': return { type: 'location', value: expr.args[0] }
            case 'and': return { type: 'boolean', value: resolveExprAs(expr.params[0], 'boolean', ctx).value && resolveExprAs(expr.params[1], 'boolean', ctx).value }
            case 'or': return { type: 'boolean', value: resolveExprAs(expr.params[0], 'boolean', ctx).value && resolveExprAs(expr.params[1], 'boolean', ctx).value }
            case 'not': return { type: 'boolean', value: !resolveExprAs(expr.params[0], 'boolean', ctx).value }
            case 'add': return resolveNumberOp(expr.params[0], expr.params[1], (a, b) => a + b, ctx)
            case 'subtract': return resolveNumberOp(expr.params[0], expr.params[1], (a, b) => a - b, ctx)
            case 'multiply': return resolveNumberOp(expr.params[0], expr.params[1], (a, b) => a * b, ctx)
            case 'divide': return resolveNumberOp(expr.params[0], expr.params[1], (a, b, i) => i ? Math.floor(a / b) : a / b, ctx)
            case 'modulo': return resolveNumberOp(expr.params[0], expr.params[1], (a, b) => a % b, ctx)
            case 'round': return { type: 'integer', value: Math.round(resolveExprAs(expr.params[0], 'number', ctx).value) }
            case 'roundUp': return { type: 'integer', value: Math.ceil(resolveExprAs(expr.params[0], 'number', ctx).value) }
            case 'roundDown': return { type: 'integer', value: Math.floor(resolveExprAs(expr.params[0], 'number', ctx).value) }
            case 'randomFloat': return resolveNumberOp(expr.params[0], expr.params[1], (a, b) => ctx.random.float(a, b), ctx)
            case 'randomInt': return resolveNumberOp(expr.params[0], expr.params[1], (a, b, isInt) => isInt ? ctx.random.int(a, b) : inlineThrow(new Error('Parameters to Random Integer expression were not integers')), ctx)
            case 'randomItem': {
                const listValue = resolveExprAs(expr.params[0], 'list', ctx)
                if (isPrimitiveValue(listValue)) throw new Error('Parameter to Random List Item expression was not a list')
                const index = ctx.random.int(0, listValue.value.length - 1)
                return throwIfNull(listValue.value[index])
            }
            case 'lowerCase': return { type: 'string', value: resolveExprAs(expr.params[0], 'string', ctx).value.toLowerCase() }
            case 'upperCase': return { type: 'string', value: resolveExprAs(expr.params[0], 'string', ctx).value.toUpperCase() }
            case 'format': return { type: 'string', value: expr.children.map(([part]) => resolveExprAs(part, 'string', ctx).value).join('') }
            case 'equal': return { type: 'boolean', value: exprValuesEqual(resolveExpr(expr.params[0], ctx), resolveExpr(expr.params[1], ctx), ctx) }
            case 'notEqual': return { type: 'boolean', value: !exprValuesEqual(resolveExpr(expr.params[0], ctx), resolveExpr(expr.params[1], ctx), ctx) }
            case 'lessThan': return resolveNumberComparison(expr.params[0], expr.params[1], (a, b) => a < b, ctx)
            case 'lessThanOrEqual': return resolveNumberComparison(expr.params[0], expr.params[1], (a, b) => a <= b, ctx)
            case 'greaterThan': return resolveNumberComparison(expr.params[0], expr.params[1], (a, b) => a > b, ctx)
            case 'greaterThanOrEqual': return resolveNumberComparison(expr.params[0], expr.params[1], (a, b) => a >= b, ctx)
            case 'pick': return resolveExprAs(expr.params[0], 'boolean', ctx).value ? resolveExpr(expr.params[1], ctx) : resolveExpr(expr.params[2], ctx)
            case 'switch': {
                for (const c of expr.children) {
                    if (resolveExprAs(c[0], 'boolean', ctx).value) return resolveExpr(c[1], ctx)
                }
                return resolveExpr(expr.params[0], ctx)
            }
            default: return assertExhaustive(expr, `Could not resolve expression ${JSON.stringify(expr)}`)
        }
    } catch (err) {
        if (err instanceof ExpressionError) {
            throw new AggregateExpressionError(expr, err, ctx)
        } else {
            throw new UnhandledExpressionError(expr, err, ctx)
        }
    }
}

export function validateExpr(expr: AnyExpr, ctx: ExprContext): string[] {
    return []
}

export function createDefaultExpr<T extends ExprType>(type: T, ctx: ExprContext): ExprOfType<T> {
    const def = EXPR_DEFINITION_MAP[type]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    const expr = { type } as any
    if (def.args) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expr.args = def.args.map(a => getContextualDefaultPrimitiveValue(a.type, ctx))
    }
    if (def.params) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expr.params = def.params.map(p => createDefaultExpr('unset', ctx))
    }
    if (def.children) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expr.children = []
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return expr
}

export function createDefaultExprChild(type: ExprType, ctx: ExprContext) {
    const def = EXPR_DEFINITION_MAP[type]
    if (def.children) {
        return def.children.map(() => createDefaultExpr('unset', ctx))
    }
    return null
}

export function guessExprReturnType(expr: AnyExpr, ctx: ExprContext): ExprValueType | null {
    const def = EXPR_DEFINITION_MAP[expr.type]
    if (def.returnTypes?.length === 1) return throwIfNull(def.returnTypes[0])
    switch (expr.type) {
        case 'add':
        case 'subtract':
        case 'multiply':
        case 'divide':
        case 'modulo': {
            const leftType = guessExprReturnType(expr.params[0], ctx)
            const rightType = guessExprReturnType(expr.params[1], ctx)
            if (leftType === 'integer' && rightType === 'integer') return 'integer'
            else return 'number'
        }
        case 'pick':
            return guessExprReturnType(expr.params[1], ctx)
        case 'switch':
            return guessExprReturnType(expr.params[0], ctx)
        default:
            return null
    }
}

export function tryCastExprValue<T extends ExprValueType>(expr: AnyExprValue, type: T, ctx: ExprContext): ExprValueOfType<T> | null {
    if (expr.type === type) {
        return expr as ExprValueOfType<T>
    }
    if (expr.type === 'variable') {
        return tryCastExprValue(throwIfNull(ctx.variables.getValue(expr.value)), type, ctx)
    }
    switch (type) {
        case 'string': {
            switch (expr.type) {
                case 'number': return { type: 'string', value: expr.value.toString() } as ExprValueOfType<T>
                case 'integer': return { type: 'string', value: expr.value.toString() } as ExprValueOfType<T>
                case 'boolean': return { type: 'string', value: expr.value.toString() } as ExprValueOfType<T>
                case 'story': return { type: 'string', value: throwIfNull(ctx.resolvers.story(expr.value)).name } as ExprValueOfType<T>
                case 'chapter': return { type: 'string', value: throwIfNull(ctx.resolvers.chapter(expr.value)).name } as ExprValueOfType<T>
                case 'scene': return { type: 'string', value: throwIfNull(ctx.resolvers.scene(expr.value)).name } as ExprValueOfType<T>
                case 'character': return { type: 'string', value: throwIfNull(ctx.resolvers.character(expr.value)).name } as ExprValueOfType<T>
                case 'portrait': return { type: 'string', value: throwIfNull(ctx.resolvers.portrait(expr.value)).name } as ExprValueOfType<T>
                case 'backdrop': return { type: 'string', value: throwIfNull(ctx.resolvers.backdrop(expr.value)).name } as ExprValueOfType<T>
                case 'song': return { type: 'string', value: throwIfNull(ctx.resolvers.song(expr.value)).name } as ExprValueOfType<T>
                case 'sound': return { type: 'string', value: throwIfNull(ctx.resolvers.sound(expr.value)).name } as ExprValueOfType<T>
                case 'macro': return { type: 'string', value: throwIfNull(ctx.resolvers.macro(expr.value)).name } as ExprValueOfType<T>
                default: break
            }
            break
        }
        case 'number': {
            switch (expr.type) {
                case 'integer': return { type: 'number', value: expr.value } as ExprValueOfType<T>
                default: break
            }
            break
        }
        default: break
    }
    return null
}

export function castExprValue<T extends ExprValueType>(value: AnyExprValue, type: T, ctx: ExprContext): ExprValueOfType<T> {
    const result = tryCastExprValue(value, type, ctx)
    if (!result) throw new CastExpressionError(value, type, ctx)
    return result
}

export function exprValueTypeAssignableTo(type: ExprValueType | null, types: ExprValueType[] | null) {
    if (type === 'variable') return true
    if (type === null || types === null) return true
    if (type === 'integer' && types.includes('number')) return true
    if (types.includes(type)) return true
    if (types.includes('string')) return true
    return false
}

export function exprValuesEqual(left: AnyExprValue, right: AnyExprValue, ctx: ExprContext): boolean {
    if (left.type === 'variable' && right.type !== 'variable') {
        const leftValue = castExprValue(left, right.type, ctx)
        return exprValuesEqual(leftValue, right, ctx)
    }
    if (right.type === 'variable' && left.type !== 'variable') {
        const rightValue = castExprValue(right, left.type, ctx)
        return exprValuesEqual(left, rightValue, ctx)
    }
    if (left.type === 'variable' && right.type === 'variable') {
        const leftValue = throwIfNull(ctx.variables.getValue(left.value))
        const rightValue = throwIfNull(ctx.variables.getValue(right.value))
        return exprValuesEqual(leftValue, rightValue, ctx)
    }
    if (left.type === 'number' && right.type === 'integer') {
        return exprValuesEqual(left, castExprValue(right, 'integer', ctx), ctx)
    }
    if (left.type === 'integer' && right.type === 'number') {
        return exprValuesEqual(castExprValue(left, 'integer', ctx), right, ctx)
    }
    if (left.type !== right.type) return false
    if (isPrimitiveValue(left) && isPrimitiveValue(right)) {
        return left.value === right.value
    } else if (!isPrimitiveValue(left) && !isPrimitiveValue(right)) {
        return left.value.length === right.value.length && left.value.every((v, i) => exprValuesEqual(v, throwIfNull(right.value[i]), ctx))
    }
    return false
}

export function prettyPrintExprValue(value: AnyExprValue, ctx: ExprContext, variable?: AnyVariableDefinition): string {
    switch (value.type) {
        case 'boolean': {
            if (variable?.type === 'flag') {
                if (value.value && variable.setValueLabel.type !== 'unset') {
                    return resolveExprAs(variable.setValueLabel, 'string', ctx).value
                }
                if (!value.value && variable.unsetValueLabel.type !== 'unset') {
                    return resolveExprAs(variable.unsetValueLabel, 'string', ctx).value
                }
            }
            return value.value ? 'True' : 'False'
        }
        case 'number': {
            const s = String(value.value)
            if (!s.includes('.')) return `${s}.0`
            return s
        }
        case 'integer': return String(value.value)
        case 'string': return JSON.stringify(value.value)
        case 'story':
        case 'chapter':
        case 'scene':
        case 'character':
        case 'portrait':
        case 'backdrop':
        case 'song':
        case 'sound':
        case 'macro':
        case 'variable': {
            const resolver = ctx.resolvers[value.type]
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
            const entity = resolver(value.value as any)
            return entity?.name ? entity.name : JSON.stringify(value.value)
        }
        case 'location': return String(value.value)
        case 'list': {
            return value.value.map(v => prettyPrintExprValue(v, ctx)).join(', ')
        }
        default: return JSON.stringify(value)
    }
}

export function prettyPrintExpr(expr: AnyExpr, ctx: ExprContext): string {
    const def = EXPR_DEFINITION_MAP[expr.type]
    let out = `${expr.type}(`
    if (def.args && 'args' in expr) {
        forEachMultiple(hintTuple(def.args, expr.args), (i, d, e) => {
            let v = JSON.stringify(e)
            switch (d.type) {
                case 'string':
                case 'number':
                case 'integer':
                case 'boolean':
                case 'location':
                    break
                default: {
                    const resolver = ctx.resolvers[d.type]
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
                    const entity = resolver(e as any)
                    v = entity?.name ? entity.name : JSON.stringify(e)
                    break
                }
            }
            out += `${d.label}: ${v}, `
        })
        if (out.endsWith(', ')) out = out.substring(0, out.length - 2)
    }
    if (def.params && 'params' in expr) {
        forEachMultiple(hintTuple(def.params, expr.params), (i, d, e) => {
            out += `${d.label}: ${prettyPrintExpr(e, ctx)}, `
        })
        if (out.endsWith(', ')) out = out.substring(0, out.length - 2)
    }
    if (def.children && 'children' in expr) {
        out += '['
        for (const c of expr.children) {
            out += '('
            for (let i = 0; i < def.children.length; i++) {
                forEachMultiple(hintTuple(def.children, c), (i, d, e) => {
                    out += `${d.label}: ${prettyPrintExpr(e, ctx)}`
                })
            }
            if (out.endsWith(', ')) out = out.substring(0, out.length - 2)
            out += '), '
        }
        if (out.endsWith(', ')) out = out.substring(0, out.length - 2)
        out += ']'
    }
    if (out.endsWith(', ')) out = out.substring(0, out.length - 2)
    out += ')'
    return out
}

export abstract class ExpressionError extends Error {

}

export class AggregateExpressionError extends ExpressionError {
    constructor(public expr: AnyExpr, cause: ExpressionError, public ctx: ExprContext) { super(`An error occurred while processing an expression:\n${String(cause)}\nExpression: ${prettyPrintExpr(expr, ctx)}`, { cause }) }
}

export class CastExpressionError extends ExpressionError {
    constructor(public value: AnyExprValue, public type: ExprValueType, public ctx: ExprContext) { super(`Could not convert expression value to ${type}.\nExpression Value: ${prettyPrintExprValue(value, ctx)}`) }
}

export class UnhandledExpressionError extends ExpressionError {
    constructor(public expr: AnyExpr, cause: unknown, public ctx: ExprContext) { super(`An error occurred while processing an expression:\n${String(cause)}\nExpression: ${prettyPrintExpr(expr, ctx)}`, { cause }) }
}

const parseSingleExprTuple = defineParser<[AnyExpr]>((c, v, d) => $.tuple(c, v, hintTuple(parseAnyExpr), d))
const parseDualExprTuple = defineParser<[AnyExpr, AnyExpr]>((c, v, d) => $.tuple(c, v, hintTuple(parseAnyExpr, parseAnyExpr), d))
const parseTripleExprTuple = defineParser<[AnyExpr, AnyExpr, AnyExpr]>((c, v, d) => $.tuple(c, v, hintTuple(parseAnyExpr, parseAnyExpr, parseAnyExpr), d))

export const parseLocationPosition = defineParser<LocationPositionValue>((c, v, d) => $.either(c, v, (c, v, d) => $.enum<Extract<LocationPositionValue, string>>(c, v, ['auto', 'left', 'center', 'right'], typeof d === 'string' ? d : undefined), $.number, d))

export const parseLocationHeight = defineParser<LocationHeightValue>((c, v, d) => $.either(c, v, (c, v, d) => $.enum<Extract<LocationHeightValue, string>>(c, v, ['auto', 'full', 'knees', 'thighs', 'waist', 'shoulder', 'head'], typeof d === 'string' ? d : undefined), $.number, d))

export const parseLocationScale = defineParser<LocationScaleValue>((c, v, d) => $.either(c, v, (c, v, d) => $.enum<Extract<LocationScaleValue, string>>(c, v, ['auto', 'near', 'middle', 'far'], typeof d === 'string' ? d : undefined), $.number, d))

export const parseLocation = defineParser<LocationValue>((c, v, d) => $.object(c, v, {
    position: parseLocationPosition,
    height: parseLocationHeight,
    scale: parseLocationScale,
}, d))

export const parseAnyExpr: ParseFunc<AnyExpr> = defineParser<AnyExpr>((c, v, d) => $.typed(c, v, {}, {
    unset: {},

    list: { children: (c, v, d) => $.array(c, v, parseSingleExprTuple, d) },

    string: { args: (c, v, d) => $.tuple(c, v, hintTuple($.string), d) },
    number: { args: (c, v, d) => $.tuple(c, v, hintTuple($.number), d) },
    integer: { args: (c, v, d) => $.tuple(c, v, hintTuple($.integer), d) },
    boolean: { args: (c, v, d) => $.tuple(c, v, hintTuple($.boolean), d) },
    location: { args: (c, v, d) => $.tuple(c, v, hintTuple(parseLocation), d) },

    story: { args: (c, v, d) => $.tuple(c, v, hintTuple($.id), d) },
    chapter: { args: (c, v, d) => $.tuple(c, v, hintTuple($.id), d) },
    scene: { args: (c, v, d) => $.tuple(c, v, hintTuple($.id), d) },
    character: { args: (c, v, d) => $.tuple(c, v, hintTuple($.id), d) },
    portrait: { args: (c, v, d) => $.tuple(c, v, hintTuple($.id), d) },
    backdrop: { args: (c, v, d) => $.tuple(c, v, hintTuple($.id), d) },
    song: { args: (c, v, d) => $.tuple(c, v, hintTuple($.id), d) },
    sound: { args: (c, v, d) => $.tuple(c, v, hintTuple($.id), d) },
    variable: { args: (c, v, d) => $.tuple(c, v, hintTuple($.id), d) },
    macro: { args: (c, v, d) => $.tuple(c, v, hintTuple($.id), d) },
    characterVariable: { args: (c, v, d) => $.tuple(c, v, hintTuple($.id), d), params: parseSingleExprTuple },

    and: { params: parseDualExprTuple },
    or: { params: parseDualExprTuple },
    not: { params: parseSingleExprTuple },

    add: { params: parseDualExprTuple },
    subtract: { params: parseDualExprTuple },
    multiply: { params: parseDualExprTuple },
    divide: { params: parseDualExprTuple },
    modulo: { params: parseDualExprTuple },

    round: { params: parseSingleExprTuple },
    roundUp: { params: parseSingleExprTuple },
    roundDown: { params: parseSingleExprTuple },

    randomFloat: { params: parseDualExprTuple },
    randomInt: { params: parseDualExprTuple },
    randomItem: { params: parseSingleExprTuple },

    lowerCase: { params: parseSingleExprTuple },
    upperCase: { params: parseSingleExprTuple },

    format: { children: (c, v, d) => $.array(c, v, parseSingleExprTuple, d) },

    equal: { params: parseDualExprTuple },
    notEqual: { params: parseDualExprTuple },
    lessThan: { params: parseDualExprTuple },
    lessThanOrEqual: { params: parseDualExprTuple },
    greaterThan: { params: parseDualExprTuple },
    greaterThanOrEqual: { params: parseDualExprTuple },

    pick: { params: parseTripleExprTuple },
    switch: { params: parseSingleExprTuple, children: (c, v, d) => $.array(c, v, parseDualExprTuple, d) },
}, d))
