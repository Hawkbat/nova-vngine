/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyExpr, EXPR_DEFINITION_MAP, EXPR_DEFINITIONS, ExprContext, ExprDefinition, ExprPrimitiveRawValueOfType, ExprPrimitiveValueType, ExprType, ExprValueType, createDefaultExpr, guessExprReturnType, createDefaultExprChild, exprValueTypeAssignableTo, validateExpr } from "../../types/expressions"
import styles from './ExpressionEditor.module.css'
import { Fragment, useState } from "react"
import { DropdownMenu, DropdownMenuItem } from "../common/DropdownMenu"
import { immAppend, immRemoveAt, immReplaceAt, immSet } from "../../utils/imm"
import { EditorIcon } from "../common/EditorIcon"
import { COMMON_ICONS, EXPR_ICONS } from "../common/Icons"
import { Field } from "../common/Field"

type ArgEditorProps<T extends ExprPrimitiveValueType> = {
    label: string,
    type: T,
    value: ExprPrimitiveRawValueOfType<T>,
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
        }
        return <>{props.type}: {props.value}</>
    }
    return <div className={styles.arg}>
        <label>{subEditor()}</label>
    </div>
}

const StringArgEditor = ({ value, setValue, label }: ArgSubEditorProps<'string'>) => {
    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value)
    }
    return <input type='text' placeholder={label} title={label} onChange={onChange} value={value} />
}

const NumberArgEditor = ({ value, setValue, label }: ArgSubEditorProps<'number'>) => {
    const [textValue, setTextValue] = useState('')
    const [useTempState, setUseTempState] = useState(false)

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTextValue(e.target.value)
        const num = parseFloat(e.target.value)
        if (!Number.isNaN(num)) {
            setValue(num)
        }
    }
    const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        setUseTempState(true)
        setTextValue(String(value))
    }
    const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        setUseTempState(false)
        setTextValue(String(value))
    }

    return <input type='text' placeholder={label} title={label} onChange={onChange} onFocus={onFocus} onBlur={onBlur} value={useTempState ? textValue : String(value)} />
}

const IntegerArgEditor = ({ value, setValue, label }: ArgSubEditorProps<'integer'>) => {
    const [textValue, setTextValue] = useState('')
    const [useTempState, setUseTempState] = useState(false)

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTextValue(e.target.value)
        const num = parseInt(e.target.value, 10)
        if (!Number.isNaN(num)) {
            setValue(num)
        }
    }
    const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        setUseTempState(true)
        setTextValue(String(value))
    }
    const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        setUseTempState(false)
        setTextValue(String(value))
    }
    
    return <input type='text' placeholder={label} title={label} onChange={onChange} onFocus={onFocus} onBlur={onBlur} value={useTempState ? textValue : String(value)} />
}

const BooleanArgEditor = ({ value, setValue, label }: ArgSubEditorProps<'boolean'>) => {
    const onClick = (e: React.MouseEvent) => setValue(!value)
    return <EditorIcon path={value ? COMMON_ICONS.checkboxChecked : COMMON_ICONS.checkboxUnchecked} label={label} onClick={onClick} />
}

const ParamEditor = ({ label, types, expr, setExpr, ctx }: { label: string, types: ExprValueType[] | null, expr: AnyExpr, setExpr: (value: AnyExpr) => void, ctx: ExprContext }) => {
    return <div className={styles.param} title={label}>
        <label>
            <ExpressionEditor expr={expr} setExpr={setExpr} paramTypes={types} ctx={ctx} />
        </label>
    </div>
}

const ExpressionIcon = ({ type, size, onClick }: { type: ExprType, size?: number, onClick?: (e: React.MouseEvent) => void }) => {
    const def = EXPR_DEFINITION_MAP[type]
    const icon = EXPR_ICONS[type]
    return <EditorIcon path={icon} label={def.label} size={size} onClick={onClick} />
}

export const ExpressionEditor = ({ expr, setExpr, paramTypes, ctx }: { expr: AnyExpr, setExpr: (newExpr: AnyExpr) => void, paramTypes?: ExprValueType[] | null, ctx: ExprContext }) => {
    const def = EXPR_DEFINITION_MAP[expr.type]

    const [exprMenuState, setExprMenuState] = useState({ open: false, x: 0, y: 0 })

    const onIconClick = (e: React.MouseEvent) => {
        const div = e.target as HTMLDivElement
        const rect = div.getBoundingClientRect()
        const x = rect.left + 10
        const y = rect.bottom - 4
        setExprMenuState({ open: true, x, y })
    }

    const closeExprMenu = () => setExprMenuState({ open: false, x: 0, y: 0 })

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
        if (def.params && d.params && expr.params && newExpr.params) {
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
            {infix ? null : <ExpressionIcon type={expr.type} onClick={onIconClick} />}
            {def.args ? <>
                {def.args.map((a, i) => <ArgEditor key={i} label={a.label} type={a.type} value={expr.args![i]} setValue={v => setExpr({ ...expr, args: immReplaceAt(expr.args!, i, v) as any })} />)}
            </> : null}
            {def.params ? <>
                {def.params.map((p, i) => <Fragment key={i}>
                    <ParamEditor label={p.label} types={p.types} expr={expr.params![i]} setExpr={v => setExpr({ ...expr, params: immReplaceAt(expr.params!, i, v) as any })} ctx={ctx} />
                    {infix && i === 0 ? <ExpressionIcon type={expr.type} onClick={onIconClick} /> : null}
                </Fragment>) ?? null}
            </> : null}
            {def.children ? <>
                {expr.children?.map((c, i) => <div key={i} className={styles.child}>
                    <EditorIcon path={COMMON_ICONS.deleteItem} label='Remove Item' size={0.75} onClick={() => setExpr(immSet(expr, 'children', immRemoveAt<AnyExpr[]>(expr.children!, i) as any))} />
                    {def.children?.map((d, j) => <ParamEditor key={j} label={d.label} types={d.types} expr={c[j]} setExpr={v => setExpr(immSet(expr, 'children', immReplaceAt(expr.children!, i, immReplaceAt(expr.children![i], j, v) as any)))} ctx={ctx} />)}
                </div>)}
                <EditorIcon path={COMMON_ICONS.addItem} label='Add Item' size={0.75} onClick={() => setExpr(immSet(expr, 'children', immAppend<AnyExpr[]>(expr.children!, createDefaultExprChild(expr.type, ctx)!) as any))} />
            </> : null}
        </div>
        {exprMenuState.open ? <DropdownMenu x={exprMenuState.x} y={exprMenuState.y} onClose={closeExprMenu}>
            {EXPR_DEFINITIONS.filter(d => getCompatibilityScore(d)).sort((a, b) => getCompatibilityScore(b) - getCompatibilityScore(a)).map(d => <DropdownMenuItem key={d.type} onClick={() => (replaceWithType(d.type), closeExprMenu())}>
                <ExpressionIcon type={d.type} />
                <span>{d.label}</span>
            </DropdownMenuItem>)}
        </DropdownMenu> : null}
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
        <ExpressionEditor expr={value} setExpr={setValue ?? (() => {})} paramTypes={paramTypes} ctx={ctx} />
    </Field>
}
