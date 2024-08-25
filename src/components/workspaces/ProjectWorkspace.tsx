import { projectStore } from "../../store/project"
import { immSet } from "../../utils/imm"
import { useStore } from "../../utils/store"
import { NumberField, StringField } from "../common/StringField"
import styles from './ProjectWorkspace.module.css'

export const ProjectWorkspace = () => {
    const [project, setProject] = useStore(projectStore)
    return <div className={styles.workspace}>
        <StringField label='Project Name' value={project.name} setValue={name => setProject(project => immSet(project, 'name', name))} validate={s => s ? '' : 'Name must be filled out'} />
        <StringField label='Project ID' value={project.id} />
        <StringField label='RNG Algorithm' value={project.editorRandState[0]} />
        <NumberField label='RNG Seed' value={project.editorRandState[1]} />
    </div>
}
