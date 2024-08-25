import { assertExhaustive } from "../utils/types"
import { StoryID, ChapterID, SceneID, VariableID, CharacterID, BackdropID, SongID, SoundID, AnyVariableDefinition, CharacterDefinition, BackdropDefinition, ChapterDefinition, SceneDefinition, SongDefinition, SoundDefinition, StoryDefinition, PortraitID } from "./definitions"

export type LocationValue = 'left' | 'center' | 'right' | number

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
    variable: { label: 'Variable', args: [{ label: 'Value', type: 'variable' }], returnTypes: ['variable'] },
    character: { label: 'Character', args: [{ label: 'Value', type: 'character' }], returnTypes: ['character'] },
    portrait: { label: 'Portrait', args: [{ label: 'Value', type: 'portrait' }], returnTypes: ['portrait'] },
    backdrop: { label: 'Backdrop', args: [{ label: 'Value', type: 'backdrop' }], returnTypes: ['backdrop'] },
    song: { label: 'Song', args: [{ label: 'Value', type: 'song' }], returnTypes: ['song'] },
    sound: { label: 'Sound', args: [{ label: 'Value', type: 'sound' }], returnTypes: ['sound'] },

    add: { label: 'Add', params: [{ label: 'Left', types: ['number', 'integer'] }, { label: 'Right', types: ['number', 'integer'] }], returnTypes: ['number', 'integer'] },
    subtract: { label: 'Subtract', params: [{ label: 'Left', types: ['number', 'integer'] }, { label: 'Right', types: ['number', 'integer'] }], returnTypes: ['number', 'integer'] },
    multiply: { label: 'Multiply', params: [{ label: 'Left', types: ['number', 'integer'] }, { label: 'Right', types: ['number', 'integer'] }], returnTypes: ['number', 'integer'] },
    divide: { label: 'Divide', params: [{ label: 'Left', types: ['number', 'integer'] }, { label: 'Right', types: ['number', 'integer'] }], returnTypes: ['number', 'integer'] },
    modulo: { label: 'Remainder', params: [{ label: 'Left', types: ['number', 'integer'] }, { label: 'Right', types: ['number', 'integer'] }], returnTypes: ['number', 'integer'] },
    
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

type ExprOfTypeFromDef<T extends ExprType, D extends PartialExprDefinition> = {
    type: T
    args: D['args'] extends undefined ? undefined : ArgValues<Exclude<D['args'], undefined>>
    params: D['params'] extends undefined ? undefined : ParamValues<Exclude<D['params'], undefined>>
    children: D['children'] extends undefined ? undefined : ChildValues<Exclude<D['children'], undefined>>
}

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
    variable: VariableID
    character: CharacterID
    portrait: PortraitID
    backdrop: BackdropID
    song: SongID
    sound: SoundID
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
    variable: '' as VariableID,
    character: '' as CharacterID,
    portrait: '' as PortraitID,
    backdrop: '' as BackdropID,
    song: '' as SongID,
    sound: '' as SoundID,
    location: 'center',
}

export type ExprPrimitiveRawValueOfType<T extends ExprPrimitiveValueType> = ExprPrimitiveValueTypeMap[T]

export type ExprPrimitiveValueType = keyof ExprPrimitiveValueTypeMap
export type ExprPrimitiveValue<T extends ExprPrimitiveValueType> = { type: T, value: ExprPrimitiveRawValueOfType<T> }
export type ExprPrimitiveValueOfType<T extends ExprPrimitiveValueType> = T extends ExprPrimitiveValueType ? ExprPrimitiveValue<T> : never
export type AnyExprPrimitiveValue = ExprPrimitiveValueOfType<ExprPrimitiveValueType>

export type ExprListValueType<T extends ExprPrimitiveValueType> = `list:${T}`
export type ExprListValue<T extends ExprPrimitiveValueType> = { type: ExprListValueType<T>, values: ExprValueOfType<T>[] }
export type ExprListValueOfType<T extends ExprPrimitiveValueType> = T extends ExprPrimitiveValueType ? ExprListValue<T> : never
export type AnyExprListValue = ExprListValueOfType<ExprPrimitiveValueType>

export type ExprValueType = ExprPrimitiveValueType | ExprListValueType<ExprPrimitiveValueType>
export type ExprValueOfType<T extends ExprValueType> = T extends ExprListValueType<infer U> ? ExprListValue<U> : T extends ExprPrimitiveValueType ? ExprPrimitiveValue<T> : never
export type AnyExprValue = AnyExprPrimitiveValue | AnyExprListValue

export type StringExpr = AnyExpr
export type NumberExpr = AnyExpr
export type IntegerExpr = AnyExpr
export type BooleanExpr = AnyExpr
export type StoryExpr = AnyExpr
export type ChapterExpr = AnyExpr
export type SceneExpr = AnyExpr
export type VariableExpr = AnyExpr
export type CharacterExpr = AnyExpr
export type PortraitExpr = AnyExpr
export type BackdropExpr = AnyExpr
export type SongExpr = AnyExpr
export type SoundExpr = AnyExpr
export type LocationExpr = AnyExpr
export type ListExpr = AnyExpr
export type ValueExpr = AnyExpr

export interface ExprContext {
    resolvers: {
        story: (id: StoryID) => StoryDefinition
        chapter: (id: ChapterID) => ChapterDefinition
        scene: (id: SceneID) => SceneDefinition
        variable: (id: VariableID) => AnyVariableDefinition
        character: (id: CharacterID) => CharacterDefinition
        backdrop: (id: BackdropID) => BackdropDefinition
        song: (id: SongID) => SongDefinition
        sound: (id: SoundID) => SoundDefinition
        variableValue: (id: VariableID) => AnyExprValue
    }
}

function isPrimitiveValueType(type: ExprValueType): type is ExprPrimitiveValueType {
    return !type.startsWith('list:')
}

function isPrimitiveValue(value: AnyExprValue): value is AnyExprPrimitiveValue {
    return isPrimitiveValueType(value.type)
}

function resolveNumberOp(left: AnyExpr, right: AnyExpr, op: (a: number, b: number, isInt: boolean) => number, ctx: ExprContext): ExprValueOfType<'number'> | ExprValueOfType<'integer'> {
    let leftValue = resolveExpr(left, ctx)
    let rightValue = resolveExpr(right, ctx)
    if (leftValue.type === 'integer' && rightValue.type === 'integer') {
        return { type: 'integer', value: op(leftValue.value, rightValue.value, true) }
    } else if (leftValue.type === 'number' && rightValue.type === 'number') {
        return { type: 'number', value: op(leftValue.value, rightValue.value, false) }
    } else {
        leftValue = castExprValue(leftValue, 'number', ctx)
        rightValue = castExprValue(rightValue, 'number', ctx)
        return { type: 'number', value: op(leftValue.value, rightValue.value, false) }
    }
}

function resolveNumberComparison(left: AnyExpr, right: AnyExpr, op: (a: number, b: number) => boolean, ctx: ExprContext): ExprValueOfType<'boolean'> {
    return { type: 'boolean', value: op(resolveExprAs(left, 'number', ctx).value, resolveExprAs(right, 'number', ctx).value) }
}

export function resolveExprAs<T extends ExprValueType>(expr: AnyExpr, type: T, ctx: ExprContext): ExprValueOfType<T> {
    return castExprValue(resolveExpr(expr, ctx), type, ctx)
}

export function resolveExpr(expr: AnyExpr, ctx: ExprContext): AnyExprValue {
    switch (expr.type) {
        case 'unset': throw new Error(`Could not resolve incomplete expression`)
        case 'list': {
            const values = expr.children.map(([item]) => resolveExpr(item, ctx))
            const subType: ExprValueType = values.length ? values[0].type : 'string'
            if (!isPrimitiveValueType(subType)) {
                throw new Error(`Could not resolve expression containing a list of lists: ${JSON.stringify(expr)}`)
            }
            return { type: `list:${subType}`, values: values.map(v => castExprValue(v, subType, ctx)) as any }
        }
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
        case 'location': return { type: 'location', value: expr.args[0] }
        case 'add': return resolveNumberOp(expr.params[0], expr.params[1], (a, b) => a + b, ctx)
        case 'subtract': return resolveNumberOp(expr.params[0], expr.params[1], (a, b) => a - b, ctx)
        case 'multiply': return resolveNumberOp(expr.params[0], expr.params[1], (a, b) => a * b, ctx)
        case 'divide': return resolveNumberOp(expr.params[0], expr.params[1], (a, b, i) => i ? Math.floor(a / b) : a / b, ctx)
        case 'modulo': return resolveNumberOp(expr.params[0], expr.params[1], (a, b) => a % b, ctx)
        case 'format': return { type: 'string', value: expr.children.map(([part]) => resolveExprAs(part, 'string', ctx)).join('') }
        case 'equal': return { type: 'boolean', value: exprValuesEqual(resolveExpr(expr.params[0], ctx), resolveExpr(expr.params[1], ctx)) }
        case 'notEqual': return { type: 'boolean', value: !exprValuesEqual(resolveExpr(expr.params[0], ctx), resolveExpr(expr.params[1], ctx)) }
        case 'lessThan': return resolveNumberComparison(expr.params[0], expr.params[1], (a, b) => a < b, ctx)
        case 'lessThanOrEqual': return resolveNumberComparison(expr.params[0], expr.params[1], (a, b) => a <= b, ctx)
        case 'greaterThan': return resolveNumberComparison(expr.params[0], expr.params[1], (a, b) => a > b, ctx)
        case 'greaterThanOrEqual': return resolveNumberComparison(expr.params[0], expr.params[1], (a, b) => a >= b, ctx)
        case 'pick': return resolveExprAs(expr.params[0], 'boolean', ctx).value ? resolveExpr(expr.params[1], ctx) : resolveExpr(expr.params[2], ctx)
        case 'switch': {
            for (const c of expr.children) {
                if (resolveExprAs(c[0], 'boolean', ctx)) return resolveExpr(c[1], ctx)
            }
            return resolveExpr(expr.params[0], ctx)
        }
        default: return assertExhaustive(expr, `Could not resolve expression ${JSON.stringify(expr)}`)
    }
}

export function createDefaultExpr<T extends ExprType>(type: T): ExprOfType<T> {
    const def = EXPR_DEFINITION_MAP[type]
    let expr: ExprOfType<T> = { type } as any
    if (def.args) {
        expr.args = def.args.map(a => PRIMITIVE_DEFAULT_VALUES[a.type]) as ExprOfType<T>['args']
    }
    if (def.params) {
        expr.params = def.params.map(p => createDefaultExpr('unset')) as ExprOfType<T>['params']
    }
    if (def.children) {
        expr.children = []
    }
    return expr
}

export function createDefaultExprChild<T extends ExprType>(type: T) {
    const def = EXPR_DEFINITION_MAP[type]
    if (def.children) {
        return def.children.map(() => createDefaultExpr('unset'))
    }
    return null
}

export function guessExprReturnType(expr: AnyExpr, ctx: ExprContext): ExprValueType | null {
    const def = EXPR_DEFINITION_MAP[expr.type]
    if (def.returnTypes?.length === 1) return def.returnTypes[0]
    switch (expr.type) {
        case 'list':
            if (expr.children.length) {
                const firstChildType = guessExprReturnType(expr.children[0][0], ctx)
                if (firstChildType === null) return null
                if (isPrimitiveValueType(firstChildType)) return `list:${firstChildType}`
            }
            break
        case 'add':
        case 'subtract':
        case 'multiply':
        case 'divide':
        case 'modulo':
            const leftType = guessExprReturnType(expr.params[0], ctx)
            const rightType = guessExprReturnType(expr.params[1], ctx)
            if (leftType === 'integer' && rightType === 'integer') return 'integer'
            else return 'number'
        case 'pick':
            return guessExprReturnType(expr.params[1], ctx)
        case 'switch':
            return guessExprReturnType(expr.params[0], ctx)
    }
    return null
}

export function castExprValue<T extends ExprValueType>(expr: AnyExprValue, type: T, ctx: ExprContext): ExprValueOfType<T> {
    if (expr.type === type) {
        return expr as ExprValueOfType<T>
    }
    if (expr.type === 'variable') {
        return castExprValue(ctx.resolvers.variableValue(expr.value), type, ctx) as ExprValueOfType<T>
    }
    switch (type) {
        case 'string': {
            switch (expr.type) {
                case 'number': return { type: 'string', value: expr.value.toString() } as ExprValueOfType<T>
                case 'integer': return { type: 'string', value: expr.value.toString() } as ExprValueOfType<T>
                case 'story': return { type: 'string', value: ctx.resolvers.story(expr.value).name } as ExprValueOfType<T>
                case 'chapter': return { type: 'string', value: ctx.resolvers.chapter(expr.value).name } as ExprValueOfType<T>
                case 'scene': return { type: 'string', value: ctx.resolvers.scene(expr.value).name } as ExprValueOfType<T>
                case 'character': return { type: 'string', value: ctx.resolvers.character(expr.value).name } as ExprValueOfType<T>
                case 'backdrop': return { type: 'string', value: ctx.resolvers.backdrop(expr.value).name } as ExprValueOfType<T>
                case 'song': return { type: 'string', value: ctx.resolvers.song(expr.value).name } as ExprValueOfType<T>
                case 'sound': return { type: 'string', value: ctx.resolvers.sound(expr.value).name } as ExprValueOfType<T>
            }
        }
        case 'number': {
            switch (expr.type) {
                case 'integer': return { type: 'number', value: expr.value } as ExprValueOfType<T>
            }
        }
    }
    throw new Error(`Unable to convert expression value ${JSON.stringify(expr)} to ${type}`)
}

export function exprValueTypeAssignableTo(type: ExprValueType | null, types: ExprValueType[] | null) {
    if (type === 'variable') return true
    if (type === null || types === null) return true
    if (type === 'integer' && types.includes('number')) return true
    if (types.includes(type)) return true
    if (types.includes('string')) return true
    return false
}

export function exprValuesEqual(left: AnyExprValue, right: AnyExprValue): boolean {
    if (left.type !== right.type) return false
    if (isPrimitiveValue(left) && isPrimitiveValue(right)) {
        return left.value === right.value
    } else if (!isPrimitiveValue(left) && !isPrimitiveValue(right)) {
        return left.values.length === right.values.length && left.values.every((v, i) => exprValuesEqual(v, right.values[i]))
    }
    return false
}

export function prettyPrintExpr(expr: AnyExpr): string {
    const def = EXPR_DEFINITION_MAP[expr.type]
    let out = `${expr.type}(`
    if (expr.args) {
        for (const a of expr.args) {
            out += `${JSON.stringify(a)}, `
        }
    }
    if (expr.params) {
        for (const p of expr.params) {
            out += `${prettyPrintExpr(p)}, `
        }
    }
    if (expr.children) {
        out += '['
        for (const c of expr.children) {
            out += '('
            for (const v of c) {
                out += `${prettyPrintExpr(v)}, `
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
