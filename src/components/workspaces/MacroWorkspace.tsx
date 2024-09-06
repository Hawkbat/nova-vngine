import { projectStore } from '../../store/project'
import { viewStateStore } from '../../store/viewstate'
import type { MacroDefinition } from '../../types/project'
import { immReplaceWhere, immSet } from '../../utils/imm'
import { useSelector } from '../../utils/store'
import { EditorButton, EditorButtonGroup } from '../common/EditorButton'
import { StepSequenceEditor, StepSequenceField } from '../editors/StepSequenceEditor'
import { EntityWorkspace } from './EntityWorkspace'

import styles from './MacroWorkspace.module.css'

const MacroEditor = () => {
    const getSubEditorState = useSelector(viewStateStore, s => s.editor?.type === 'macroSteps' ? s.editor : null)
    const getMacro = useSelector(projectStore, s => s.macros.find(s => s.id === getSubEditorState()?.macroID))
    const macro = getMacro()
    const setMacro = (setter: (macro: MacroDefinition) => MacroDefinition) => projectStore.setValue(project => immSet(project, 'macros', immReplaceWhere(project.macros, s => s.id === macro?.id, e => setter(e))))
    return macro ? <StepSequenceEditor steps={macro.steps} setSteps={setter => setMacro(s => immSet(s, 'steps', setter(s.steps)))} /> : null
}

export const MacroWorkspace = () => {
    const getIsInEditor = useSelector(viewStateStore, s => s.editor?.type === 'macroSteps')
    return getIsInEditor() ? <>
        <MacroEditor />
    </> : <>
        <EntityWorkspace type='macro' getVariableScopes={macro => [{ type: 'macro', value: macro.id }, { type: 'macros', value: [macro.id] }, { type: 'allMacros' }]}>{(macro, setMacro) => <>
            <StepSequenceField steps={macro.steps} setSteps={setter => setMacro(m => immSet(m, 'steps', setter(m.steps)))} />
            <EditorButtonGroup side='left'>
                <EditorButton onClick={() => viewStateStore.setValue(s => immSet(s, 'editor', { type: 'macroSteps', macroID: macro.id, stepID: null }))}>Open Macro in  Sequence Editor</EditorButton>
            </EditorButtonGroup>
        </>}</EntityWorkspace>
    </>
}
