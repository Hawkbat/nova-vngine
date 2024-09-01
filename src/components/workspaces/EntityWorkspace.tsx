import { projectStore } from '../../store/project'
import { useViewStateScope } from '../../store/operations'
import type { EntityOfType, EntityType, ProjectDefinition, ProjectEntityKeyOf } from '../../types/project'
import { getEntityChildTypes, getProjectEntityKey } from '../../types/project'
import { prettyPrintIdentifier } from '../../utils/display'
import { immReplaceWhere, immSet } from '../../utils/imm'
import { useSelector } from '../../utils/store'
import { StringField } from '../common/StringField'
import { EntityList } from '../common/EntityList'
import styles from './EntityWorkspace.module.css'
import { settingsStore } from '../../store/settings'

export const EntityWorkspace = <T extends EntityType>({ type, children }: {
    type: T
    children: (item: EntityOfType<T>, setItem: (setter: (value: EntityOfType<T>) => EntityOfType<T>) => void) => React.ReactNode
}) => {
    const developerMode = useSelector(settingsStore, s => s.developerMode)
    const projectKey = getProjectEntityKey(type)
    const [itemID] = useViewStateScope(type)
    const items = useSelector(projectStore, s => s[projectKey])

    const childTypes = getEntityChildTypes(type)

    const item = (itemID ? items.find(s => s.id === itemID) ?? null : null) as EntityOfType<T> | null

    return <div className={styles.workspace}>
        {item ? <>
            <div key={item.id} className={styles.fields}>
                <StringField label={`${prettyPrintIdentifier(type)} Name`} value={item.name} setValue={name => projectStore.setValue(project => immSet(project, projectKey, immReplaceWhere(project[projectKey] as EntityOfType<T>[], s => s.id === itemID, item => immSet(item, 'name', name)) as ProjectDefinition[ProjectEntityKeyOf<T>]))} validate={s => s ? '' : 'Name must be filled out'} />
                {developerMode ? <>
                    <StringField label={`${prettyPrintIdentifier(type)} ID`} value={item.id} />
                </> : null}
                {children(item, setter => projectStore.setValue(project => immSet(project, projectKey, immReplaceWhere(project[projectKey] as EntityOfType<T>[], s => s.id === itemID, e => setter(e)) as ProjectDefinition[ProjectEntityKeyOf<T>])))}
            </div>
            {childTypes.length ? <div className={styles.childLists}>
                {childTypes.map(c => <EntityList key={c} type={c} />)}
            </div> : null}
        </> : <>
            <EntityList type={type} />
        </>}
    </div>
}
