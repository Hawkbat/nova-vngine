import { getProjectExprContext } from '../../operations/project'
import { projectStore } from '../../store/project'
import { viewStateStore } from '../../store/viewstate'
import { isVariableInScope, type MacroDefinition, type VariableID } from '../../types/project'
import { immAppend, immRemoveAt, immReplaceAt, immReplaceWhere, immSet } from '../../utils/imm'
import { useSelector } from '../../utils/store'
import { EditorButton, EditorButtonGroup } from '../common/EditorButton'
import { EditorIcon } from '../common/EditorIcon'
import { EntityField } from '../common/EntityField'
import { Field } from '../common/Field'
import { COMMON_ICONS } from '../common/Icons'
import { StepSequenceEditor, StepSequenceField } from '../editors/StepSequenceEditor'
import { EntityWorkspace } from './EntityWorkspace'

import styles from './MacroWorkspace.module.css'

const MacroStepEditor = () => {
    const getSubEditorState = useSelector(viewStateStore, s => s.editor?.type === 'macroSteps' ? s.editor : null)
    const getMacro = useSelector(projectStore, s => s.macros.find(s => s.id === getSubEditorState()?.macroID))
    const macro = getMacro()
    const setMacro = (setter: (macro: MacroDefinition) => MacroDefinition) => projectStore.setValue(project => immSet(project, 'macros', immReplaceWhere(project.macros, s => s.id === macro?.id, e => setter(e))))
    const ctx = immSet(getProjectExprContext(), 'scope', { macro: macro?.id ?? true })
    return macro ? <StepSequenceEditor steps={macro.steps} setSteps={setter => setMacro(s => immSet(s, 'steps', setter(s.steps)))} ctx={ctx} /> : null
}

const MacroEditor = ({ macro, setMacro }: { macro: MacroDefinition, setMacro: (setter: (macro: MacroDefinition) => MacroDefinition) => void }) => {
    const macroVariables = useSelector(projectStore, s => s.variables)().filter(v => isVariableInScope(v, { type: 'macro', value: macro.id }) || isVariableInScope(v, { type: 'macros', value: [macro.id] }) || isVariableInScope(v, { type: 'allMacros' }))

    const ctx = immSet(getProjectExprContext(), 'scope', { macro: macro.id })

    return <>
        <Field label='Inputs'>
            {macro.inputs.map((p, i) => <div key={i} className={styles.param}>
                <EntityField type='variable' value={p} setValue={v => setMacro(m => immSet(m, 'inputs', immReplaceAt(m.inputs, i, v)))} options={macroVariables} />
                <EditorIcon path={COMMON_ICONS.deleteItem} label='Delete Input' onClick={() => setMacro(m => immSet(m, 'inputs', immRemoveAt(m.inputs, i)))} />
            </div>)}
            <EditorIcon path={COMMON_ICONS.addItem} label='Add Input' onClick={() => setMacro(m => immSet(m, 'inputs', immAppend(m.inputs, '' as VariableID)))} />
        </Field>
        <Field label='Outputs'>
            {macro.outputs.map((p, i) => <div key={i} className={styles.param}>
                <EntityField type='variable' value={p} setValue={v => setMacro(m => immSet(m, 'outputs', immReplaceAt(m.outputs, i, v)))} options={macroVariables} />
                <EditorIcon path={COMMON_ICONS.deleteItem} label='Delete Output' onClick={() => setMacro(m => immSet(m, 'outputs', immRemoveAt(m.outputs, i)))} />
            </div>)}
            <EditorIcon path={COMMON_ICONS.addItem} label='Add Output' onClick={() => setMacro(m => immSet(m, 'outputs', immAppend(m.outputs, '' as VariableID)))} />
        </Field>
        <StepSequenceField steps={macro.steps} setSteps={setter => setMacro(m => immSet(m, 'steps', setter(m.steps)))} ctx={ctx} />
        <EditorButtonGroup side='left'>
            <EditorButton onClick={() => viewStateStore.setValue(s => immSet(s, 'editor', { type: 'macroSteps', macroID: macro.id, stepID: null }))}>Open Macro in  Sequence Editor</EditorButton>
        </EditorButtonGroup>
    </>
}

export const MacroWorkspace = () => {
    const getIsInEditor = useSelector(viewStateStore, s => s.editor?.type === 'macroSteps')
    return getIsInEditor() ? <>
        <MacroStepEditor />
    </> : <>
        <EntityWorkspace type='macro' getVariableScopes={macro => [{ type: 'macro', value: macro.id }, { type: 'macros', value: [macro.id] }, { type: 'allMacros' }]}>{(macro, setMacro) => <MacroEditor key={macro.id} macro={macro} setMacro={setMacro} />}</EntityWorkspace>
    </>
}
