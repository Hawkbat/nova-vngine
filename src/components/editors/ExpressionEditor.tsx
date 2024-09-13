/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Fragment } from 'react'

import { getEntityByID, getEntityEditorDisplayName } from '../../operations/project'
import { useAsset } from '../../store/assets'
import type { AnyExpr, ExprContext, ExprDefinition, ExprPrimitiveRawValueOfType, ExprPrimitiveValueType, ExprType, ExprValueType } from '../../types/expressions'
import { createDefaultExpr, createDefaultExprChild, EXPR_DEFINITION_MAP, EXPR_DEFINITIONS, exprValueTypeAssignableTo, guessExprReturnType, validateExpr } from '../../types/expressions'
import { type AnyVariableDefinition, type EntityIDOf, type EntityOfType, type EntityType, isVariableInScope, type SongDefinition, type SoundDefinition } from '../../types/project'
import { forEachMultiple } from '../../utils/array'
import { classes } from '../../utils/display'
import { existsFilter, throwIfNull } from '../../utils/guard'
import { immAppend, immRemoveAt, immReplaceAt, immSet } from '../../utils/imm'
import { assertExhaustive, hintTuple } from '../../utils/types'
import { AudioPlayer } from '../common/AudioPlayer'
import { BooleanField } from '../common/BooleanField'
import { DropdownMenuItem, SearchDropdownMenu, useDropdownMenuState } from '../common/DropdownMenu'
import { EditorButton } from '../common/EditorButton'
import { EditorIcon } from '../common/EditorIcon'
import { Field } from '../common/Field'
import { COMMON_ICONS, EXPR_ICONS } from '../common/Icons'
import { LocationField } from '../common/LocationField'
import { NumberField } from '../common/NumberField'
import { StringField } from '../common/StringField'

import styles from './ExpressionEditor.module.css'

type ArgEditorProps<T extends ExprPrimitiveValueType> = {
    label: string
    type: T
    value: ExprPrimitiveRawValueOfType<T>
    setValue: (value: ExprPrimitiveRawValueOfType<T>) => void
    ctx: ExprContext
}
type ArgSubEditorProps<T extends ExprPrimitiveValueType> = T extends ExprPrimitiveValueType ? ArgEditorProps<T> : never

const ArgEditor = <T extends ExprPrimitiveValueType>(props: ArgEditorProps<T>) => {
    const subEditor = () => {
        const narrowedProps = props as ArgSubEditorProps<T>
        switch (narrowedProps.type) {
            case 'string': return <StringArgEditor {...narrowedProps} />
            case 'number': return <NumberArgEditor {...narrowedProps} />
            case 'integer': return <IntegerArgEditor {...narrowedProps} />
            case 'boolean': return <BooleanArgEditor {...narrowedProps} />
            case 'location': return <LocationArgEditor {...narrowedProps} />
            case 'story': return <EntityArgEditor<'story'> {...narrowedProps} />
            case 'chapter': return <EntityArgEditor<'chapter'> {...narrowedProps} />
            case 'scene': return <EntityArgEditor<'scene'> {...narrowedProps} />
            case 'character': return <EntityArgEditor<'character'> {...narrowedProps} />
            case 'portrait': return <EntityArgEditor<'portrait'> {...narrowedProps} />
            case 'backdrop': return <EntityArgEditor<'backdrop'> {...narrowedProps} />
            case 'song': return <EntityArgEditor<'song'> {...narrowedProps} />
            case 'sound': return <EntityArgEditor<'sound'> {...narrowedProps} />
            case 'variable': return <EntityArgEditor<'variable'> {...narrowedProps} />
            case 'macro': return <EntityArgEditor<'macro'> {...narrowedProps} />
            default: assertExhaustive(narrowedProps, `Unexpected arg type ${JSON.stringify(props.type)}`)
        }
    }
    return <div className={styles.arg}>
        {subEditor()}
    </div>
}

const StringArgEditor = ({ value, setValue, label }: ArgSubEditorProps<'string'>) => {
    return <StringField value={value} setValue={setValue} />
}

const NumberArgEditor = ({ value, setValue, label }: ArgSubEditorProps<'number'>) => {
    return <NumberField value={value} setValue={setValue} />
}

const IntegerArgEditor = ({ value, setValue, label }: ArgSubEditorProps<'integer'>) => {
    return <NumberField value={value} setValue={setValue} />
}

const BooleanArgEditor = ({ value, setValue, label }: ArgSubEditorProps<'boolean'>) => {
    return <BooleanField value={value} setValue={setValue} />
}

const EntityArgEditor = <T extends EntityType>({ type, value, setValue, label, ctx }: ArgEditorProps<T>) => {
    const entity = getEntityByID(type, value as unknown as EntityIDOf<T>)
    const [dropdownProps, openDropdown] = useDropdownMenuState()
    const getAssetUrl = useAsset(type === 'sound' || type === 'song' ? (entity as SoundDefinition | SongDefinition).audio : null, false)

    const suggestions = ctx.suggestions[type]() as EntityIDOf<T>[]

    const getScopeValue = (e: EntityOfType<T>): number => {
        switch (type) {
            case 'variable': {
                const v = e as AnyVariableDefinition
                if (ctx.scope.character) {
                    if (typeof ctx.scope.character === 'string') {
                        if (isVariableInScope(v, { type: 'character', value: ctx.scope.character })) return 10
                        if (isVariableInScope(v, { type: 'characters', value: [ctx.scope.character] })) return 9
                    }
                    if (isVariableInScope(v, { type: 'allCharacters' })) return 1
                    return -1
                }
                if (ctx.scope.macro) {
                    if (typeof ctx.scope.macro === 'string') {
                        if (isVariableInScope(v, { type: 'macro', value: ctx.scope.macro })) return 10
                        if (isVariableInScope(v, { type: 'macros', value: [ctx.scope.macro] })) return 9
                    }
                    if (isVariableInScope(v, { type: 'allMacros' })) return 8
                    if (isVariableInScope(v, { type: 'allScenes' })) return 3
                    if (isVariableInScope(v, { type: 'allChapters' })) return 2
                    if (isVariableInScope(v, { type: 'allStories' })) return 1
                    return -1
                }
                if (ctx.scope.scene) {
                    if (typeof ctx.scope.scene === 'string') {
                        if (isVariableInScope(v, { type: 'scene', value: ctx.scope.scene })) return 10
                        if (isVariableInScope(v, { type: 'scenes', value: [ctx.scope.scene] })) return 9
                    }
                    if (isVariableInScope(v, { type: 'allScenes' })) return 8
                    if (isVariableInScope(v, { type: 'allChapters' })) return 2
                    if (isVariableInScope(v, { type: 'allStories' })) return 1
                    return -1
                }
                break
            }
            default: return 0
        }
        return 0
    }

    const items = suggestions
        .map(s => getEntityByID(type, s))
        .filter(existsFilter)
        .sort((a, b) => {
            const scopeDiff = getScopeValue(b) - getScopeValue(a)
            if (scopeDiff !== 0) return scopeDiff
            return getEntityEditorDisplayName(type, a).localeCompare(getEntityEditorDisplayName(type, b))
        })


    return <>
        <EditorButton className={styles.argButton} style='text' onClick={openDropdown}>
            {getEntityEditorDisplayName(type, entity)}
        </EditorButton>
        <SearchDropdownMenu<EntityOfType<T>> {...dropdownProps} items={items} filter={(e, search) => e.name.toLowerCase().includes(search.toLowerCase())}>{(entity: EntityOfType<T>) => <DropdownMenuItem key={entity.id} onClick={() => (setValue(entity.id as ExprPrimitiveRawValueOfType<T>), dropdownProps.onClose())}>{getEntityEditorDisplayName(type, entity)}</DropdownMenuItem>}</SearchDropdownMenu>
        {type === 'sound' ? <AudioPlayer src={getAssetUrl()} /> : null}
    </>
}

const LocationArgEditor = ({ value, setValue, label }: ArgSubEditorProps<'location'>) => {
    return <LocationField className={classes(styles.argButton, styles.argTextInput)} value={value} setValue={setValue} />
}

const ParamEditor = ({ label, types, expr, setExpr, ctx }: { label: string, types: ExprValueType[] | null, expr: AnyExpr, setExpr: (value: AnyExpr) => void, ctx: ExprContext }) => {
    return <div className={styles.param} title={label}>
        <ExpressionEditor expr={expr} setExpr={setExpr} paramTypes={types} ctx={ctx} />
    </div>
}

const ExpressionIcon = ({ type, size, onClick }: { type: ExprType, size?: number, onClick?: (e: React.MouseEvent) => void }) => {
    const def = EXPR_DEFINITION_MAP[type]
    const icon = EXPR_ICONS[type]
    return <EditorIcon path={icon} label={def.label} size={size} onClick={onClick} />
}

export const ExpressionEditor = ({ expr, setExpr, paramTypes, ctx }: { expr: AnyExpr, setExpr: (newExpr: AnyExpr) => void, paramTypes?: ExprValueType[] | null, ctx: ExprContext }) => {
    const def = EXPR_DEFINITION_MAP[expr.type]

    const [exprMenuProps, openExprMenu] = useDropdownMenuState()

    const getCompatibilityScore = (d: ExprDefinition) => {
        if (d.type === 'unset') return 10
        const currentReturnType = guessExprReturnType(expr, ctx)
        if (d.returnTypes && currentReturnType && exprValueTypeAssignableTo(currentReturnType, d.returnTypes)) return 5
        if (d.returnTypes && paramTypes && d.returnTypes.some(p => exprValueTypeAssignableTo(p, paramTypes))) return 4

        if (currentReturnType === null) return 2
        if (paramTypes === null) return 2
        if (d.returnTypes === null) return 2
        return 0
    }

    const replaceWithType = (type: ExprType) => {
        const d = EXPR_DEFINITION_MAP[type]
        const newExpr = createDefaultExpr(type, ctx)
        if (def.params && d.params && 'params' in expr && 'params' in newExpr) {
            forEachMultiple(hintTuple(def.params, d.params), (i, p, c) => {
                if (p.label === c.label && expr.params[i]) {
                    newExpr.params[i] = expr.params[i]
                }
            })
        }
        setExpr(newExpr)
    }

    const infix = def.params && def.params.length >= 2

    return <>
        <div className={styles.expr}>
            {infix ? null : <ExpressionIcon type={expr.type} onClick={openExprMenu} />}
            {def.args && 'args' in expr ? <>
                {def.args.map((a, i) => <ArgEditor key={i} label={a.label} type={a.type} value={throwIfNull(expr.args[i])} setValue={v => setExpr({ ...expr, args: immReplaceAt(expr.args, i, v) as any })} ctx={ctx} />)}
            </> : null}
            {def.params && 'params' in expr ? <>
                {def.params.map((p, i) => <Fragment key={i}>
                    <ParamEditor label={p.label} types={p.types} expr={throwIfNull(expr.params[i])} setExpr={v => setExpr({ ...expr, params: immReplaceAt(expr.params, i, v) as any })} ctx={ctx} />
                    {infix && i === 0 ? <ExpressionIcon type={expr.type} onClick={openExprMenu} /> : null}
                </Fragment>)}
            </> : null}
            {def.children && 'children' in expr ? <>
                {expr.children.map((c, i) => <div key={i} className={styles.child}>
                    <EditorIcon path={COMMON_ICONS.deleteItem} label='Remove Item' size={0.75} onClick={() => setExpr(immSet(expr, 'children', immRemoveAt<AnyExpr[]>(expr.children, i) as any))} />
                    {def.children?.map((d, j) => <ParamEditor key={j} label={d.label} types={d.types} expr={throwIfNull(c[j])} setExpr={v => setExpr(immSet(expr, 'children', immReplaceAt(expr.children, i, immReplaceAt(throwIfNull(expr.children[i]), j, v) as any)))} ctx={ctx} />)}
                </div>)}
                <EditorIcon path={COMMON_ICONS.addItem} label='Add Item' size={0.75} onClick={() => setExpr(immSet(expr, 'children', immAppend(expr.children, createDefaultExprChild(expr.type, ctx) as any)))} />
            </> : null}
        </div>
        <SearchDropdownMenu {...exprMenuProps} items={EXPR_DEFINITIONS.filter(d => getCompatibilityScore(d)).sort((a, b) => getCompatibilityScore(b) - getCompatibilityScore(a))} filter={(def, search) => def.label.toLowerCase().includes(search.toLowerCase())}>{d => <DropdownMenuItem key={d.type} onClick={e => (replaceWithType(d.type), exprMenuProps.onClose())}>
            <ExpressionIcon type={d.type} />
            <span>{d.label}</span>
        </DropdownMenuItem>}</SearchDropdownMenu>
    </>
}

export const ExpressionEmbed = ({ expr, setExpr, ctx }: { expr: AnyExpr, setExpr: (value: AnyExpr) => void, ctx: ExprContext }) => {
    return <div className={styles.embed}>
        <ExpressionEditor expr={expr} setExpr={setExpr} paramTypes={['string']} ctx={ctx} />
    </div>
}

export const ExpressionField = ({ label, value, setValue, paramTypes, ctx }: { label: string, value: AnyExpr, setValue?: (value: AnyExpr) => void, paramTypes?: ExprValueType[] | null, ctx: ExprContext }) => {

    const validate = (expr: AnyExpr) => {
        const errors = validateExpr(expr, ctx)
        return errors.join('\n')
    }

    return <Field label={label} error={validate(value)}>
        <ExpressionEditor expr={value} setExpr={setValue ?? (() => { })} paramTypes={paramTypes} ctx={ctx} />
    </Field>
}
