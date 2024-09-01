import { immSet } from '../../utils/imm'
import { StepSequenceEditor } from '../editors/StepSequenceEditor'
import { EntityWorkspace } from './EntityWorkspace'


export const SceneWorkspace = () => {
    return <EntityWorkspace type='scene'>{(scene, setScene) => <>
        <StepSequenceEditor steps={scene.steps} setSteps={setter => setScene(s => immSet(s, 'steps', setter(s.steps)))} />
    </>}</EntityWorkspace>
}
