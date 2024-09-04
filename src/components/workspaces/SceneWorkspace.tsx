import { projectStore } from '../../store/project'
import { viewStateStore } from '../../store/viewstate'
import type { SceneDefinition } from '../../types/project'
import { immReplaceWhere, immSet } from '../../utils/imm'
import { useSelector } from '../../utils/store'
import { EditorButton, EditorButtonGroup } from '../common/EditorButton'
import { StepSequenceEditor } from '../editors/StepSequenceEditor'
import { EntityWorkspace } from './EntityWorkspace'

const SceneEditor = () => {
    const getSubEditorState = useSelector(viewStateStore, s => s.editor?.type === 'sceneSteps' ? s.editor : null)
    const getScene = useSelector(projectStore, s => s.scenes.find(s => s.id === getSubEditorState()?.sceneID))
    const scene = getScene()
    const setScene = (setter: (scene: SceneDefinition) => SceneDefinition) => projectStore.setValue(project => immSet(project, 'scenes', immReplaceWhere(project.scenes, s => s.id === scene?.id, e => setter(e))))
    return scene ? <StepSequenceEditor steps={scene.steps} setSteps={setter => setScene(s => immSet(s, 'steps', setter(s.steps)))} /> : null
}

export const SceneWorkspace = () => {
    const getIsInEditor = useSelector(viewStateStore, s => s.editor?.type === 'sceneSteps')
    return getIsInEditor() ? <>
        <SceneEditor />
    </> : <>
        <EntityWorkspace type='scene' getVariableScopes={scene => [{ type: 'scene', value: scene.id }, { type: 'scenes', value: [scene.id] }, { type: 'allScenes' }]}>{(scene, setScene) => <>
            <EditorButtonGroup side='left'>
                <EditorButton onClick={() => viewStateStore.setValue(s => immSet(s, 'editor', { type: 'sceneSteps', sceneID: scene.id, stepID: null }))}>Edit Scene</EditorButton>
            </EditorButtonGroup>
        </>}</EntityWorkspace>
    </>
}
