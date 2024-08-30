/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AnyExpr, ExprContext, ExprDefinition, ExprPrimitiveRawValueOfType, ExprPrimitiveValueType, ExprType, ExprValueType } from '../../types/expressions'
import { EXPR_DEFINITION_MAP, EXPR_DEFINITIONS, createDefaultExpr, guessExprReturnType, createDefaultExprChild, exprValueTypeAssignableTo, validateExpr } from '../../types/expressions'
import styles from './ExpressionEditor.module.css'
import { Fragment } from 'react'
import { DropdownMenuItem, SearchDropdownMenu, useDropdownMenuState } from '../common/DropdownMenu'
import { immAppend, immRemoveAt, immReplaceAt, immSet } from '../../utils/imm'
import { EditorIcon } from '../common/EditorIcon'
import { COMMON_ICONS, EXPR_ICONS } from '../common/Icons'
import { Field } from '../common/Field'
import type { EntityIDOf, EntityOfType, EntityType } from '../../types/project'
import { getProjectEntityKey } from '../../types/project'
import { EditorButton } from '../common/EditorButton'
import { projectStore } from '../../store/project'
import { getEntityByID } from '../../store/operations'
import { useSelector } from '../../utils/store'
import { StringField } from '../common/StringField'
import { NumberField } from '../common/NumberField'
import { BooleanField } from '../common/BooleanField'

type ArgEditorProps<T extends ExprPrimitiveValueType> = {
    label: string
    type: T
    value: ExprPrimitiveRawValueOfType<T>
    setValue: (value: ExprPrimitiveRawValueOfType<T>) => void
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
        }
        return <>{props.type}: {props.value}</>
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

const EntityArgEditor = <T extends EntityType>({ type, value, setValue, label }: ArgEditorProps<T>) => {
    const entity = getEntityByID(type, value as unknown as EntityIDOf<T>)
    const [dropdownProps, openDropdown] = useDropdownMenuState()
    const [items] = useSelector(projectStore, s => s[getProjectEntityKey(type)])
    return <>
        <EditorButton className={styles.argButton} style='text' onClick={openDropdown}>
            {entity ? entity.name ? entity.name : 'Untitled' : 'None'}
        </EditorButton>
        <SearchDropdownMenu<EntityOfType<T>> {...dropdownProps} items={items as EntityOfType<T>[]} filter={(e, search) => e.name.toLowerCase().includes(search.toLowerCase())}>{(entity: EntityOfType<T>) => <DropdownMenuItem key={entity.id} onClick={() => (setValue(entity.id as ExprPrimitiveRawValueOfType<T>), dropdownProps.onClose())}>{entity.name ? entity.name : 'Untitled'}</DropdownMenuItem>}</SearchDropdownMenu>
    </>
}

const LocationArgEditor = ({ value, setValue, label }: ArgSubEditorProps<'location'>) => {
    return <>
        <EditorIcon path={COMMON_ICONS.alignAuto} active={value === 'auto'} label='Auto' style='solid' onClick={() => setValue('auto')} />
        <EditorIcon path={COMMON_ICONS.alignLeft} active={value === 'left'} label='Left' style='solid' onClick={() => setValue('left')} />
        <EditorIcon path={COMMON_ICONS.alignCenter} active={value === 'center'} label='Center' style='solid' onClick={() => setValue('center')} />
        <EditorIcon path={COMMON_ICONS.alignRight} active={value === 'right'} label='Right' style='solid' onClick={() => setValue('right')} />
        <EditorIcon path={COMMON_ICONS.alignCustom} active={typeof value === 'number'} label='Custom' style='solid' onClick={() => setValue(0.5)} />
        {typeof value === 'number' ? <NumberField className={styles.argTextInput} value={value} setValue={v => setValue(v)} /> : null}
    </>
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
            for (let i = 0; i < def.params.length; i++) {
                if (def.params[i].label === d.params[i].label) {
                    newExpr.params[i] = expr.params[i]
                }
            }
        }
        setExpr(newExpr)
    }

    const infix = def.params && def.params.length >= 2

    return <>
        <div className={styles.expr}>
            {infix ? null : <ExpressionIcon type={expr.type} onClick={openExprMenu} />}
            {def.args && 'args' in expr ? <>
                {def.args.map((a, i) => <ArgEditor key={i} label={a.label} type={a.type} value={expr.args[i]} setValue={v => setExpr({ ...expr, args: immReplaceAt(expr.args, i, v) as any })} />)}
            </> : null}
            {def.params && 'params' in expr ? <>
                {def.params.map((p, i) => <Fragment key={i}>
                    <ParamEditor label={p.label} types={p.types} expr={expr.params[i]} setExpr={v => setExpr({ ...expr, params: immReplaceAt(expr.params, i, v) as any })} ctx={ctx} />
                    {infix && i === 0 ? <ExpressionIcon type={expr.type} onClick={openExprMenu} /> : null}
                </Fragment>)}
            </> : null}
            {def.children && 'children' in expr ? <>
                {expr.children.map((c, i) => <div key={i} className={styles.child}>
                    <EditorIcon path={COMMON_ICONS.deleteItem} label='Remove Item' size={0.75} onClick={() => setExpr(immSet(expr, 'children', immRemoveAt<AnyExpr[]>(expr.children, i) as any))} />
                    {def.children?.map((d, j) => <ParamEditor key={j} label={d.label} types={d.types} expr={c[j]} setExpr={v => setExpr(immSet(expr, 'children', immReplaceAt(expr.children, i, immReplaceAt(expr.children[i], j, v) as any)))} ctx={ctx} />)}
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
