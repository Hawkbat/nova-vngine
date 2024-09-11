import { downloadBlob, exportProjectToZip } from '../../operations/export'
import { projectStore } from '../../store/project'
import { settingsStore } from '../../store/settings'
import { ENTITY_TYPES, getEntityParentType } from '../../types/project'
import { immSet } from '../../utils/imm'
import { useSelector, useStore } from '../../utils/store'
import { EditorButton, EditorButtonGroup } from '../common/EditorButton'
import { EntityList } from '../common/EntityList'
import { NumberField } from '../common/NumberField'
import { StringField } from '../common/StringField'

import styles from './ProjectWorkspace.module.css'

export const ProjectWorkspace = () => {
    const getDeveloperMode = useSelector(settingsStore, s => s.developerMode)
    const [getProject, setProject] = useStore(projectStore)

    const onExportZip = async () => {
        const blob = await exportProjectToZip()
        downloadBlob(blob, `${projectStore.getValue().name}.zip`)
    }

    return <div className={styles.fields}>
        <StringField label='Project Name' value={getProject().name} setValue={name => setProject(project => immSet(project, 'name', name))} validate={s => s ? '' : 'Name must be filled out'} />
        {getDeveloperMode() ? <>
            <StringField label='Project ID' value={getProject().id} />
            <StringField label='RNG Algorithm' value={getProject().editorRandState[0]} />
            <NumberField label='RNG Seed' value={getProject().editorRandState[1]} />
        </> : null}
        <EditorButtonGroup side='left'>
            <EditorButton onClick={() => void onExportZip()}>Export Project as ZIP</EditorButton>
        </EditorButtonGroup>
        {ENTITY_TYPES.filter(t => !getEntityParentType(t)).map(t => <EntityList key={t} type={t} />)}
    </div>
}
