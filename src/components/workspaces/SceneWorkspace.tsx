import { immCreateScene, projectStore } from "../../store/project"
import { SceneDefinition } from "../../types/definitions"
import { EntityWorkspace } from "./EntityWorkspace"
import { StepSequenceEditor } from "../editors/StepSequenceEditor"
import { useStore } from "../../utils/store"
import { immReplaceBy, immSet } from "../../utils/imm"
import styles from "./SceneWorkspace.module.css"

const SceneEditor = ({ scene }: { scene: SceneDefinition }) => {
    const [, setProject] = useStore(projectStore)
    return <>
        <StepSequenceEditor steps={scene.steps} setSteps={setter => setProject(p => immSet(p, 'scenes', immReplaceBy(p.scenes, s => s.id, immSet(scene, 'steps', setter(scene.steps)))))} />
    </>
}

export const SceneWorkspace = () => {
    return <EntityWorkspace type='scene' immCreate={immCreateScene}>{scene => <SceneEditor scene={scene} />}</EntityWorkspace>
}
