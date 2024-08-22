import { AnyExpr, EXPR_DEFINITION_MAP, EXPR_DEFINITIONS, ExprContext, ExprDefinition, ExprPrimitiveRawValueOfType, ExprPrimitiveValueType, ExprType, ExprValueType, guessExprReturnType } from "../types/expressions"
import { Icon } from '@mdi/react'
import { mdiAccount, mdiArrowExpandHorizontal, mdiBookMultipleOutline, mdiBookOpenVariantOutline, mdiClose, mdiEqual, mdiFlag, mdiFormatListCheckbox, mdiFormatListChecks, mdiFormatListGroup, mdiFormatText, mdiGreaterThan, mdiGreaterThanOrEqual, mdiImageArea, mdiLessThan, mdiLessThanOrEqual, mdiMinus, mdiMusic, mdiNotEqualVariant, mdiPercent, mdiPlus, mdiPound, mdiPoundBox, mdiSignatureText, mdiSlashForward, mdiSquareOutline, mdiTextBoxOutline, mdiVariable, mdiVolumeHigh } from '@mdi/js'
import styles from './ExpressionEditor.module.css'
import { useState } from "react"
import { DropdownMenu, DropdownMenuItem } from "./DropdownMenu"
import { inlineThrow } from "../utils/types"

const EXPR_ICON_MAP: Record<ExprType, string> = {
    unset: mdiSquareOutline,
    list: mdiFormatListGroup,
    string: mdiFormatText,
    number: mdiPound,
    integer: mdiPoundBox,
    boolean: mdiFlag,
    story: mdiBookMultipleOutline,
    chapter: mdiBookOpenVariantOutline,
    scene: mdiTextBoxOutline,
    variable: mdiVariable,
    character: mdiAccount,
    backdrop: mdiImageArea,
    song: mdiMusic,
    sound: mdiVolumeHigh,
    location: mdiArrowExpandHorizontal,
    add: mdiPlus,
    subtract: mdiMinus,
    multiply: mdiClose,
    divide: mdiSlashForward,
    modulo: mdiPercent,
    format: mdiSignatureText,
    equal: mdiEqual,
    notEqual: mdiNotEqualVariant,
    lessThan: mdiLessThan,
    lessThanOrEqual: mdiLessThanOrEqual,
    greaterThan: mdiGreaterThan,
    greaterThanOrEqual: mdiGreaterThanOrEqual,
    pick: mdiFormatListChecks,
    switch: mdiFormatListCheckbox,
}

const ArgEditor = <T extends ExprPrimitiveValueType>({ label, type, value, setValue }: { label: string, type: T, value: ExprPrimitiveRawValueOfType<T>, setValue: (value: ExprPrimitiveRawValueOfType<T>) => void }) => {
    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(type === 'boolean' ? e.target.checked : e.target.value as any)
    }
    return <div className={styles.arg}>
        <label>
            <input type={type === 'integer' || type === 'number' ? 'number' : type === 'boolean' ? 'checkbox' : 'text'} onChange={onChange} checked={!!value} value={String(value)} />
        </label>
    </div>
}

const ParamEditor = ({ label, types, expr, setExpr }: { label: string, types: ExprValueType[] | null, expr: AnyExpr, setExpr: (value: AnyExpr) => void }) => {
    return <div className={styles.param}>
        <label>
            <ExpressionEditor expr={expr} setExpr={setExpr} paramTypes={types} />
        </label>
    </div>
}

const ExpressionIcon = ({ type, onClick }: { type: ExprType, onClick?: (e: React.MouseEvent) => void }) => {
    const def = EXPR_DEFINITION_MAP[type]
    const icon = EXPR_ICON_MAP[type]
    return <>
        <div className={styles.exprIcon} style={{ cursor: onClick ? 'pointer' : undefined }} onClick={onClick}>
            <Icon path={icon} title={def.label} size={1} />
        </div>
    </>
}

const nullExprContext: ExprContext = {
    resolvers: {
        story: id => inlineThrow(new Error(`Not implemented`)),
        chapter: id => inlineThrow(new Error(`Not implemented`)),
        scene: id => inlineThrow(new Error(`Not implemented`)),
        character: id => inlineThrow(new Error(`Not implemented`)),
        backdrop: id => inlineThrow(new Error(`Not implemented`)),
        song: id => inlineThrow(new Error(`Not implemented`)),
        sound: id => inlineThrow(new Error(`Not implemented`)),
        variable: id => inlineThrow(new Error(`Not implemented`)),
        variableValue: id => inlineThrow(new Error(`Not implemented`)),
    }
}

export const ExpressionEditor = ({ expr, setExpr, paramTypes }: { expr: AnyExpr, setExpr: (newExpr: AnyExpr) => void, paramTypes?: ExprValueType[] | null }) => {
    const def = EXPR_DEFINITION_MAP[expr.type]

    const [exprMenuState, setExprMenuState] = useState({ open: false, x: 0, y: 0 })

    const onIconClick = (e: React.MouseEvent) => {
        const div = e.target as HTMLDivElement
        const rect = div.getBoundingClientRect()
        const x = rect.left + 10
        const y = rect.bottom - 4
        setExprMenuState({ open: true, x, y })
    }

    const isTypeAssignable = (type: ExprValueType | null, types: ExprValueType[] | null) => {
        if (type === 'variable') return true
        if (type === null || types === null) return true
        if (type === 'integer' && types.includes('number')) return true
        if (types.includes(type)) return true
        if (types.includes('string')) return true
        return false
    }

    const getCompatibilityScore = (d: ExprDefinition) => {
        if (d.type === 'unset') return 10
        const currentReturnType = guessExprReturnType(expr, nullExprContext)
        if (d.returnTypes && currentReturnType && isTypeAssignable(currentReturnType, d.returnTypes)) return 5
        if (d.returnTypes && paramTypes && d.returnTypes.some(p => isTypeAssignable(p, paramTypes))) return 4

        if (currentReturnType === null) return 2
        if (paramTypes === null) return 2
        if (d.returnTypes === null) return 2
        return 0
    }

    const replaceWithType = (type: ExprType) => {
        const d = EXPR_DEFINITION_MAP[type]
        const newExpr = d.default()
        for (const k in d.params) {
            if (k in def.params) {
                (newExpr as any)[k] = (expr as any)[k]
            }
        }
        setExpr(newExpr)
    }

    return <>
        <div className={styles.expr}>
            <ExpressionIcon type={expr.type} onClick={onIconClick} />
            {Object.entries(def.args).map(([k, v]) => <ArgEditor key={k} label={k} type={v} value={(expr as any)[k]} setValue={v => setExpr({ ...expr, [k]: v })} />)}
            {Object.entries(def.params).map(([k, v]) => <ParamEditor key={k} label={k} types={v} expr={(expr as any)[k]} setExpr={v => setExpr({ ...expr, [k]: v })} />)}
            {def.children ? <>
                {expr.children?.map((c, i) => <div key={i} className={styles.child}>
                    {Object.entries(def.children!).map(([k, v]) => <ParamEditor key={k} label={k} types={v} expr={(c as any)[k]} setExpr={v => setExpr({ ...expr, children: expr.children.slice(0, i).concat([{ ...c, [k]: v }]).concat(expr.children.slice(i + 1)) as any })} />)}
                </div>)}
            </> : null}
        </div>
        {exprMenuState.open ? <DropdownMenu x={exprMenuState.x} y={exprMenuState.y} onClose={() => setExprMenuState({ open: false, x: 0, y: 0 })}>
            {EXPR_DEFINITIONS.filter(d => getCompatibilityScore(d)).sort((a, b) => getCompatibilityScore(b) - getCompatibilityScore(a)).map(d => <DropdownMenuItem key={d.type} onClick={() => replaceWithType(d.type)}>
                <ExpressionIcon type={d.type} />
                <span>{d.label}</span>
            </DropdownMenuItem>)}
        </DropdownMenu> : null}
    </>
}

export const ExpressionEmbed = ({ expr, setExpr }: { expr: AnyExpr, setExpr: (value: AnyExpr) => void }) => {
    return <div className={styles.embed}>
        <ExpressionEditor expr={expr} setExpr={setExpr} paramTypes={['string']} />
    </div>
}
