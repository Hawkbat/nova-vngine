import { EntityWorkspace } from './EntityWorkspace'
import { StepSequenceEditor } from '../editors/StepSequenceEditor'
import { immSet } from '../../utils/imm'


export const SceneWorkspace = () => {
    return <EntityWorkspace type='scene' subEditor={(scene, setScene) => <StepSequenceEditor steps={scene.steps} setSteps={setter => setScene(scene => immSet(scene, 'steps', setter(scene.steps)))} />}>{(scene, setScene) => <>

    </>}</EntityWorkspace>
}
