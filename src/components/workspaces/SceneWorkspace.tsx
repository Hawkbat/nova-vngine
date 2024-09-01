import { EntityWorkspace } from './EntityWorkspace'
import { StepSequenceEditor } from '../editors/StepSequenceEditor'
import { immSet } from '../../utils/imm'


export const SceneWorkspace = () => {
    return <EntityWorkspace type='scene'>{(scene, setScene) => <>
        <StepSequenceEditor steps={scene.steps} setSteps={setter => setScene(s => immSet(s, 'steps', setter(s.steps)))} />
    </>}</EntityWorkspace>
}
