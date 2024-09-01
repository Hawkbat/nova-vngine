import { Fragment } from 'react/jsx-dev-runtime'

import { useViewStateScope } from '../../store/operations'
import { projectStore } from '../../store/project'
import { settingsStore } from '../../store/settings'
import type { EntityOfType, EntityType, ProjectDefinition, ProjectEntityKeyOf } from '../../types/project'
import { getEntityChildTypes, getProjectEntityKey } from '../../types/project'
import { prettyPrintIdentifier } from '../../utils/display'
import { immReplaceWhere, immSet } from '../../utils/imm'
import { useSelector } from '../../utils/store'
import { EntityList } from '../common/EntityList'
import { StringField } from '../common/StringField'

import styles from './EntityWorkspace.module.css'

export const EntityWorkspace = <T extends EntityType>({ type, children, preview }: {
    type: T
    children: (item: EntityOfType<T>, setItem: (setter: (value: EntityOfType<T>) => EntityOfType<T>) => void) => React.ReactNode
    preview?: (item: EntityOfType<T>) => React.ReactNode
}) => {
    const getDeveloperMode = useSelector(settingsStore, s => s.developerMode)
    const projectKey = getProjectEntityKey(type)
    const [getItemID] = useViewStateScope(type)
    const getItems = useSelector(projectStore, s => s[projectKey])

    const childTypes = getEntityChildTypes(type)

    const item = (getItemID() ? getItems().find(s => s.id === getItemID()) ?? null : null) as EntityOfType<T> | null

    return item ? <Fragment key={item.id}>
        <div className={styles.fields}>
            <StringField label={`${prettyPrintIdentifier(type)} Name`} value={item.name} setValue={name => projectStore.setValue(project => immSet(project, projectKey, immReplaceWhere(project[projectKey] as EntityOfType<T>[], s => s.id === getItemID(), item => immSet(item, 'name', name)) as ProjectDefinition[ProjectEntityKeyOf<T>]))} validate={s => s ? '' : 'Name must be filled out'} />
            {getDeveloperMode() ? <>
                <StringField label={`${prettyPrintIdentifier(type)} ID`} value={item.id} />
            </> : null}
            {children(item, setter => projectStore.setValue(project => immSet(project, projectKey, immReplaceWhere(project[projectKey] as EntityOfType<T>[], s => s.id === getItemID(), e => setter(e)) as ProjectDefinition[ProjectEntityKeyOf<T>])))}
            {childTypes.length ? <div className={styles.childLists}>
                {childTypes.map(c => <EntityList key={c} type={c} />)}
            </div> : null}
        </div>
        {preview ? <div className={styles.preview}>
            {preview(item)}
        </div> : null}
    </Fragment> : <>
        <EntityList type={type} />
    </>
}
