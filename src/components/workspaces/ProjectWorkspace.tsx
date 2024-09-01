import { projectStore } from '../../store/project'
import { immSet } from '../../utils/imm'
import { useSelector, useStore } from '../../utils/store'
import { StringField } from '../common/StringField'
import { NumberField } from '../common/NumberField'
import styles from './ProjectWorkspace.module.css'
import { settingsStore } from '../../store/settings'
import { ENTITY_TYPES, getEntityParentType } from '../../types/project'
import { EntityList } from '../common/EntityList'

export const ProjectWorkspace = () => {
    const getDeveloperMode = useSelector(settingsStore, s => s.developerMode)
    const [getProject, setProject] = useStore(projectStore)
    return <div className={styles.fields}>
        <StringField label='Project Name' value={getProject().name} setValue={name => setProject(project => immSet(project, 'name', name))} validate={s => s ? '' : 'Name must be filled out'} />
        {getDeveloperMode() ? <>
            <StringField label='Project ID' value={getProject().id} />
            <StringField label='RNG Algorithm' value={getProject().editorRandState[0]} />
            <NumberField label='RNG Seed' value={getProject().editorRandState[1]} />
        </> : null}
        {ENTITY_TYPES.filter(t => !getEntityParentType(t)).map(t => <EntityList key={t} type={t} />)}
    </div>
}
