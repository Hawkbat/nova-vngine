import { projectStore } from '../../store/project'
import { immSet } from '../../utils/imm'
import { useSelector, useStore } from '../../utils/store'
import { StringField } from '../common/StringField'
import { NumberField } from '../common/NumberField'
import styles from './ProjectWorkspace.module.css'
import { settingsStore } from '../../store/settings'
import { ENTITY_TYPES } from '../../types/project'
import { EntityList } from '../common/EntityList'

export const ProjectWorkspace = () => {
    const developerMode = useSelector(settingsStore, s => s.developerMode)
    const [project, setProject] = useStore(projectStore)
    return <div className={styles.workspace}>
        <StringField label='Project Name' value={project.name} setValue={name => setProject(project => immSet(project, 'name', name))} validate={s => s ? '' : 'Name must be filled out'} />
        {developerMode ? <>
            <StringField label='Project ID' value={project.id} />
            <StringField label='RNG Algorithm' value={project.editorRandState[0]} />
            <NumberField label='RNG Seed' value={project.editorRandState[1]} />
        </> : null}
        {ENTITY_TYPES.map(t => <EntityList key={t} type={t} />)}
    </div>
}
