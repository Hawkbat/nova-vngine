import { getProjectExprContext, immConvertVariable } from '../../store/operations'
import { type AnyPartialVariableDefinition, VARIABLE_TYPES } from '../../types/project'
import { prettyPrintIdentifier } from '../../utils/display'
import { immSet } from '../../utils/imm'
import { DropdownField } from '../common/DropdownField'
import { ExpressionField } from '../editors/ExpressionEditor'
import { EntityWorkspace } from './EntityWorkspace'

import styles from './VariableWorkspace.module.css'

const PartialVariableEditor = ({ variable, setVariable }: { variable: AnyPartialVariableDefinition, setVariable: (setter: (value: AnyPartialVariableDefinition) => AnyPartialVariableDefinition) => void }) => {
    const ctx = getProjectExprContext()

    return <>
        {variable.type === 'flag' ? <>
            <ExpressionField label='Label If Set' value={variable.setValueLabel} setValue={expr => setVariable(v => v.type === 'flag' ? immSet(v, 'setValueLabel', expr) : v)} ctx={ctx} />
            <ExpressionField label='Label If Not Set' value={variable.unsetValueLabel} setValue={expr => setVariable(v => v.type === 'flag' ? immSet(v, 'unsetValueLabel', expr) : v)} ctx={ctx} />
        </> : variable.type === 'singleChoice' ? <>
            <ExpressionField label='Options' value={variable.options} setValue={expr => setVariable(v => v.type === 'singleChoice' ? immSet(v, 'options', expr) : v)} ctx={ctx} />
        </> : variable.type === 'multipleChoice' ? <>
            <ExpressionField label='Options' value={variable.options} setValue={expr => setVariable(v => v.type === 'multipleChoice' ? immSet(v, 'options', expr) : v)} ctx={ctx} />
        </> : variable.type === 'list' ? <>
            <PartialVariableEditor variable={variable.elements} setVariable={pv => setVariable(v => v.type === 'list' ? immSet(v, 'elements', pv(v.elements)) : v)} />
        </> : variable.type === 'lookup' ? <>
            <PartialVariableEditor variable={variable.keys} setVariable={pv => setVariable(v => v.type === 'lookup' ? immSet(v, 'keys', pv(v.elements)) : v)} />
            <PartialVariableEditor variable={variable.elements} setVariable={pv => setVariable(v => v.type === 'lookup' ? immSet(v, 'elements', pv(v.elements)) : v)} />
        </> : null}
    </>
}

export const VariableWorkspace = () => {
    const ctx = getProjectExprContext()

    return <EntityWorkspace type='variable'>{(variable, setVariable) => <>
        <DropdownField label='Variable Type' value={variable.type} setValue={t => setVariable(v => immConvertVariable(v, t))} options={VARIABLE_TYPES} format={t => prettyPrintIdentifier(t)} />
        <PartialVariableEditor variable={variable} setVariable={pv => setVariable(v => ({ ...v, ...pv }))} />
        <ExpressionField label='Default Value' value={variable.default} setValue={expr => setVariable(v => immSet(v, 'default', expr))} ctx={ctx} />
    </>}</EntityWorkspace>
}
