import { assertExhaustive } from "../utils/types"
import { StoryID, ChapterID, SceneID, VariableID, CharacterID, BackdropID, SongID, SoundID, AnyVariableDefinition, CharacterDefinition, BackdropDefinition, ChapterDefinition, SceneDefinition, SongDefinition, SoundDefinition, StoryDefinition } from "./definitions"

export type LocationValue = 'left' | 'center' | 'right' | number

type ExprMapEntry<Args extends Record<string, ExprPrimitiveValueType>, Params extends Record<string, ExprValueType[] | null>, ReturnTypes extends ExprValueType[] | null, Children extends Record<string, ExprValueType[] | null> | undefined = undefined> = {
    args: Args
    params: Params
    returnTypes: ReturnTypes
    children: Children
}

type ExprMap = {
    unset: ExprMapEntry<{}, {}, null>

    list: ExprMapEntry<{}, {}, null, { item: null }>

    string: ExprMapEntry<{ value: 'string' }, {}, ['string']>
    number: ExprMapEntry<{ value: 'number' }, {}, ['number']>
    integer: ExprMapEntry<{ value: 'integer' }, {}, ['integer']>
    boolean: ExprMapEntry<{ value: 'boolean' }, {}, ['boolean']>
    location: ExprMapEntry<{ value: 'location' }, {}, ['location']>

    story: ExprMapEntry<{ value: 'story' }, {}, ['story']>
    chapter: ExprMapEntry<{ value: 'chapter' }, {}, ['chapter']>
    scene: ExprMapEntry<{ value: 'scene' }, {}, ['scene']>
    variable: ExprMapEntry<{ value: 'variable' }, {}, ['variable']>
    character: ExprMapEntry<{ value: 'character' }, {}, ['character']>
    backdrop: ExprMapEntry<{ value: 'backdrop' }, {}, ['backdrop']>
    song: ExprMapEntry<{ value: 'song' }, {}, ['song']>
    sound: ExprMapEntry<{ value: 'sound' }, {}, ['sound']>

    add: ExprMapEntry<{}, { left: ['number', 'integer'], right: ['number', 'integer'] }, ['number', 'integer']>
    subtract: ExprMapEntry<{}, { left: ['number', 'integer'], right: ['number', 'integer'] }, ['number', 'integer']>
    multiply: ExprMapEntry<{}, { left: ['number', 'integer'], right: ['number', 'integer'] }, ['number', 'integer']>
    divide: ExprMapEntry<{}, { left: ['number', 'integer'], right: ['number', 'integer'] }, ['number', 'integer']>
    modulo: ExprMapEntry<{}, { left: ['number', 'integer'], right: ['number', 'integer'] }, ['number', 'integer']>

    format: ExprMapEntry<{}, {}, ['string'], { part: ['string'] }>

    equal: ExprMapEntry<{}, { left: null, right: null }, ['boolean']>
    notEqual: ExprMapEntry<{}, { left: null, right: null }, ['boolean']>
    lessThan: ExprMapEntry<{}, { left: ['number'], right: ['number'] }, ['boolean']>
    lessThanOrEqual: ExprMapEntry<{}, { left: ['number'], right: ['number'] }, ['boolean']>
    greaterThan: ExprMapEntry<{}, { left: ['number'], right: ['number'] }, ['boolean']>
    greaterThanOrEqual: ExprMapEntry<{}, { left: ['number'], right: ['number'] }, ['boolean']>

    pick: ExprMapEntry<{}, { if: ['boolean'], then: null, else: null }, null>
    switch: ExprMapEntry<{}, { default: null }, null, { if: ['boolean'], then: null }>
}

export interface ExprDefinition {
    type: ExprType
    label: string
    args: Record<string, ExprPrimitiveValueType>
    params: Record<string, ExprValueType[] | null>
    returnTypes: ExprValueType[] | null
    children?: Record<string, ExprValueType[] | null> | undefined
    default: () => AnyExpr
}

const EXPRS = {
    unset: { label: 'Unset', args: {}, params: {}, returnTypes: null, children: undefined, default: () => ({ type: 'unset' }) },

    list: { label: 'List', args: {}, params: {}, returnTypes: null, children: { item: null }, default: () => ({ type: 'list', children: [{ item: { type: 'unset' } }] }) },

    string: { label: 'Text', args: { value: 'string' }, params: {}, returnTypes: ['string'], children: undefined, default: () => ({ type: 'string', value: '' }) },
    number: { label: 'Number', args: { value: 'number' }, params: {}, returnTypes: ['number'], children: undefined, default: () => ({ type: 'number', value: 0 }) },
    integer: { label: 'Integer', args: { value: 'integer' }, params: {}, returnTypes: ['integer'], children: undefined, default: () => ({ type: 'integer', value: 0 }) },
    boolean: { label: 'Flag', args: { value: 'boolean' }, params: {}, returnTypes: ['boolean'], children: undefined, default: () => ({ type: 'boolean', value: false }) },
    location: { label: 'Location', args: { value: 'location' }, params: {}, returnTypes: ['location'], children: undefined, default: () => ({ type: 'location', value: 'center' }) },
    
    story: { label: 'Story', args: { value: 'story' }, params: {}, returnTypes: ['story'], children: undefined, default: () => ({ type: 'story', value: '' as StoryID }) },
    chapter: { label: 'Chapter', args: { value: 'chapter' }, params: {}, returnTypes: ['chapter'], children: undefined , default: () => ({ type: 'chapter', value: '' as ChapterID })},
    scene: { label: 'Scene', args: { value: 'scene' }, params: {}, returnTypes: ['scene'], children: undefined, default: () => ({ type: 'scene', value: '' as SceneID }) },
    variable: { label: 'Variable', args: { value: 'variable' }, params: {}, returnTypes: ['variable'], children: undefined, default: () => ({ type: 'variable', value: '' as VariableID }) },
    character: { label: 'Character', args: { value: 'character' }, params: {}, returnTypes: ['character'], children: undefined, default: () => ({ type: 'character', value: '' as CharacterID }) },
    backdrop: { label: 'Backdrop', args: { value: 'backdrop' }, params: {}, returnTypes: ['backdrop'], children: undefined, default: () => ({ type: 'backdrop', value: '' as BackdropID }) },
    song: { label: 'Song', args: { value: 'song' }, params: {}, returnTypes: ['song'], children: undefined, default: () => ({ type: 'song', value: '' as SongID }) },
    sound: { label: 'Sound', args: { value: 'sound' }, params: {}, returnTypes: ['sound'], children: undefined, default: () => ({ type: 'sound', value: '' as SoundID }) },

    add: { label: 'Add', args: {}, params: { left: ['number', 'integer'], right: ['number', 'integer'] }, returnTypes: ['number', 'integer'], children: undefined, default: () => ({ type: 'add', left: { type: 'unset' }, right: { type: 'number', value: 0 } }) },
    subtract: { label: 'Subtract', args: {}, params: { left: ['number', 'integer'], right: ['number', 'integer'] }, returnTypes: ['number', 'integer'], children: undefined, default: () => ({ type: 'subtract', left: { type: 'unset' }, right: { type: 'number', value: 0 } }) },
    multiply: { label: 'Multiply', args: {}, params: { left: ['number', 'integer'], right: ['number', 'integer'] }, returnTypes: ['number', 'integer'], children: undefined, default: () => ({ type: 'multiply', left: { type: 'unset' }, right: { type: 'number', value: 1 } }) },
    divide: { label: 'Divide', args: {}, params: { left: ['number', 'integer'], right: ['number', 'integer'] }, returnTypes: ['number', 'integer'], children: undefined, default: () => ({ type: 'divide', left: { type: 'unset' }, right: { type: 'number', value: 1 } }) },
    modulo: { label: 'Remainder', args: {}, params: { left: ['number', 'integer'], right: ['number', 'integer'] }, returnTypes: ['number', 'integer'], children: undefined, default: () => ({ type: 'modulo', left: { type: 'unset' }, right: { type: 'number', value: 1 } }) },
    format: { label: 'Formatted Text', args: {}, params: {}, returnTypes: ['string'], children: { part: ['string'] }, default: () => ({ type: 'format', children: [] }) },

    equal: { label: 'Equal To', args: {}, params: { left: null, right: null }, returnTypes: ['boolean'], children: undefined, default: () => ({ type: 'equal', left: { type: 'unset' }, right: { type: 'unset' } }) },
    notEqual: { label: 'Not Equal To', args: {}, params: { left: null, right: null }, returnTypes: ['boolean'], children: undefined, default: () => ({ type: 'notEqual', left: { type: 'unset' }, right: { type: 'unset' } }) },
    lessThan: { label: 'Less Than', args: {}, params: { left: ['number'], right: ['number'] }, returnTypes: ['boolean'], children: undefined, default: () => ({ type: 'lessThan', left: { type: 'unset' }, right: { type: 'unset' } }) },
    lessThanOrEqual: { label: 'Less Than Or Equal To', args: {}, params: { left: ['number'], right: ['number'] }, returnTypes: ['boolean'], children: undefined, default: () => ({ type: 'lessThanOrEqual', left: { type: 'unset' }, right: { type: 'unset' } }) },
    greaterThan: { label: 'Greater Than', args: {}, params: { left: ['number'], right: ['number'] }, returnTypes: ['boolean'], children: undefined, default: () => ({ type: 'greaterThan', left: { type: 'unset' }, right: { type: 'unset' } }) },
    greaterThanOrEqual: { label: 'Greater Than Or Equal To', args: {}, params: { left: ['number'], right: ['number'] }, returnTypes: ['boolean'], children: undefined, default: () => ({ type: 'greaterThanOrEqual', left: { type: 'unset' }, right: { type: 'unset' } }) },

    pick: { label: 'Either-Or', args: {}, params: { if: ['boolean'], then: null, else: null }, returnTypes: null, children: undefined, default: () => ({ type: 'pick', if: { type: 'equal', left: { type: 'unset' }, right: { type: 'unset' } }, then: { type: 'unset' }, else: { type: 'unset' } }) },
    switch: { label: 'One-Of', args: {}, params: { default: null }, returnTypes: null, children: { if: ['boolean'], then: null }, default: () => ({ type: 'switch', default: { type: 'unset' }, children: [{ if: { type: 'equal', left: { type: 'unset' }, right: { type: 'unset' } }, then: { type: 'unset' } }] }) },
} as const satisfies { [K in ExprType]: ExprMap[K] & Omit<ExprDefinition, 'type'> & { default: () => ExprOfType<K> } }

export const EXPR_DEFINITION_MAP: Record<ExprType, Omit<ExprDefinition, 'type'>> = EXPRS

export const EXPR_DEFINITIONS: ExprDefinition[] = Object.entries(EXPRS).map(([k, v]) => ({ type: k as ExprType, ...v }))

export type ExprType = keyof ExprMap
export type ExprOfType<T extends ExprType> = T extends ExprType ?
    { type: T } &
    { [K in keyof ExprMap[T]['args']]: ExprPrimitiveRawValueOfType<Extract<ExprMap[T]['args'][K], ExprPrimitiveValueType>> } &
    { [K in keyof ExprMap[T]['params']]: AnyExpr } &
    (ExprMap[T]['children'] extends undefined ? { children?: undefined } : { children: { [K in keyof ExprMap[T]['children']]: AnyExpr }[] })
    : never
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
    backdrop: BackdropID
    song: SongID
    sound: SoundID
    location: LocationValue
}

export type ExprPrimitiveRawValueOfType<T extends ExprPrimitiveValueType> = ExprPrimitiveValueTypeMap[T]

export type ExprPrimitiveValueType = keyof ExprPrimitiveValueTypeMap
export type ExprPrimitiveValue<T extends ExprPrimitiveValueType> = { type: T, value: ExprPrimitiveValueTypeMap[T] }
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
            const values = expr.children.map(c => resolveExpr(c.item, ctx))
            const subType: ExprValueType = values.length ? values[0].type : 'string'
            if (!isPrimitiveValueType(subType)) {
                throw new Error(`Could not resolve expression containing a list of lists: ${JSON.stringify(expr)}`)
            }
            return { type: `list:${subType}`, values: values.map(v => castExprValue(v, subType, ctx)) as any }
        }
        case 'string': return { type: 'string', value: expr.value }
        case 'number': return { type: 'number', value: expr.value }
        case 'integer': return { type: 'integer', value: expr.value }
        case 'boolean': return { type: 'boolean', value: expr.value }
        case 'story': return { type: 'story', value: expr.value }
        case 'chapter': return { type: 'chapter', value: expr.value }
        case 'scene': return { type: 'scene', value: expr.value }
        case 'variable': return { type: 'variable', value: expr.value }
        case 'character': return { type: 'character', value: expr.value }
        case 'backdrop': return { type: 'backdrop', value: expr.value }
        case 'song': return { type: 'song', value: expr.value }
        case 'sound': return { type: 'sound', value: expr.value }
        case 'location': return { type: 'location', value: expr.value }
        case 'add': return resolveNumberOp(expr.left, expr.right, (a, b) => a + b, ctx)
        case 'subtract': return resolveNumberOp(expr.left, expr.right, (a, b) => a - b, ctx)
        case 'multiply': return resolveNumberOp(expr.left, expr.right, (a, b) => a * b, ctx)
        case 'divide': return resolveNumberOp(expr.left, expr.right, (a, b, i) => i ? Math.floor(a / b) : a / b, ctx)
        case 'modulo': return resolveNumberOp(expr.left, expr.right, (a, b) => a % b, ctx)
        case 'format': return { type: 'string', value: expr.children.map(p => castExprValue(resolveExpr(p.part, ctx), 'string', ctx)).join('') }
        case 'equal': return { type: 'boolean', value: exprValuesEqual(resolveExpr(expr.left, ctx), resolveExpr(expr.right, ctx)) }
        case 'notEqual': return { type: 'boolean', value: !exprValuesEqual(resolveExpr(expr.left, ctx), resolveExpr(expr.right, ctx)) }
        case 'lessThan': return resolveNumberComparison(expr.left, expr.right, (a, b) => a < b, ctx)
        case 'lessThanOrEqual': return resolveNumberComparison(expr.left, expr.right, (a, b) => a <= b, ctx)
        case 'greaterThan': return resolveNumberComparison(expr.left, expr.right, (a, b) => a > b, ctx)
        case 'greaterThanOrEqual': return resolveNumberComparison(expr.left, expr.right, (a, b) => a >= b, ctx)
        case 'pick': return resolveExprAs(expr.if, 'boolean', ctx).value ? resolveExpr(expr.then, ctx) : resolveExpr(expr.else, ctx)
        case 'switch': {
            for (const c of expr.children) {
                if (resolveExprAs(c.if, 'boolean', ctx)) return resolveExpr(c.then, ctx)
            }
            return resolveExpr(expr.default, ctx)
        }
        default: return assertExhaustive(expr, `Could not resolve expression ${JSON.stringify(expr)}`)
    }
}

export function guessExprReturnType(expr: AnyExpr, ctx: ExprContext): ExprValueType | null {
    const def = EXPR_DEFINITION_MAP[expr.type]
    if (def.returnTypes?.length === 1) return def.returnTypes[0]
    switch (expr.type) {
        case 'list':
            if (expr.children.length) {
                const firstChildType = guessExprReturnType(expr.children[0].item, ctx)
                if (firstChildType === null) return null
                if (isPrimitiveValueType(firstChildType)) return `list:${firstChildType}`
            }
            break
        case 'add':
        case 'subtract':
        case 'multiply':
        case 'divide':
        case 'modulo':
            const leftType = guessExprReturnType(expr.left, ctx)
            const rightType = guessExprReturnType(expr.right, ctx)
            if (leftType === 'integer' && rightType === 'integer') return 'integer'
            else return 'number'
        case 'pick':
            return guessExprReturnType(expr.then, ctx)
        case 'switch':
            return guessExprReturnType(expr.default, ctx)
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
    for (const k in def.args) {
        out += `${k}: ${JSON.stringify((expr as any)[k])}, `
    }
    for (const k in def.params) {
        out += `${k}: ${prettyPrintExpr((expr as any)[k])}, `
    }
    if (def.children) {
        out += '['
        for (const c of (expr as any).children) {
            out += '('
            for (const k in def.children) {
                out += `${k}: ${prettyPrintExpr(c[k])}, `
            }
            if (out.endsWith(', ')) out = out.substring(0, out.length - 2)
            out += '), '
        }
        out += ']'
    }
    if (out.endsWith(', ')) out = out.substring(0, out.length - 2)
    out += ')'
    return out
}
