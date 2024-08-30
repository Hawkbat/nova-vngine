import { Fragment } from 'react/jsx-dev-runtime'
import { projectStore } from '../../store/project'
import { useViewStateScope } from '../../store/operations'
import type { EntityIDOf, EntityOfType, EntityParentIDOf, EntityType, ProjectDefinition, ProjectEntityKeyOf } from '../../types/project'
import { getEntityParentID, getEntityParentType, getProjectEntityKey } from '../../types/project'
import { prettyPrintIdentifier } from '../../utils/display'
import { immReplaceBy, immSet } from '../../utils/imm'
import { useSelector } from '../../utils/store'
import { EditorButton } from '../common/EditorButton'
import { EditorIcon } from '../common/EditorIcon'
import { COMMON_ICONS, EXPR_VALUE_ICONS } from '../common/Icons'
import { StringField } from '../common/StringField'
import styles from './EntityWorkspace.module.css'

export const EntityWorkspace = <T extends EntityType>({ type, immCreate, children }: {
    type: T
    immCreate: (project: ProjectDefinition, parentID: EntityParentIDOf<T>) => [ProjectDefinition, EntityOfType<T>]
    children: (item: EntityOfType<T>) => React.ReactNode
}) => {
    const parentType = getEntityParentType(type)
    const projectKey = getProjectEntityKey(type)
    const [itemID, setScope] = useViewStateScope(type)
    const [scopedParentID, setParentScope] = useViewStateScope(parentType)
    const [items, setProject] = useSelector(projectStore, s => s[projectKey])
    const [parentItems] = useSelector(projectStore, s => parentType ? s[getProjectEntityKey(parentType)] : null)

    const item = (itemID ? items.find(s => s.id === itemID) ?? null : null) as EntityOfType<T> | null

    const onNewItem = (parentID?: EntityParentIDOf<T> | null) => {
        if (parentType) {
            if (!parentID) return
            const [project, item] = immCreate(projectStore.getSnapshot(), parentID)
            setProject(() => project)
            setScope(item.id as EntityIDOf<T>)
        } else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const [project, item] = immCreate(projectStore.getSnapshot(), undefined!)
            setProject(() => project)
            setScope(item.id as EntityIDOf<T>)
        }
    }

    const onSelectParent = (parentID: EntityParentIDOf<T>) => {
        if (!parentType) return
        setParentScope(parentID)
    }

    const onSelectItem = (id: EntityIDOf<T>) => {
        setScope(id)
    }

    return <div className={styles.workspace}>
        {item ? <>
            <StringField label={`${prettyPrintIdentifier(type)} Name`} value={item.name} setValue={name => setProject(project => immSet(project, projectKey, immReplaceBy(project[projectKey] as EntityOfType<T>[], s => s.id, immSet(item, 'name', name)) as ProjectDefinition[ProjectEntityKeyOf<T>]))} validate={s => s ? '' : 'Name must be filled out'} />
            <StringField label={`${prettyPrintIdentifier(type)} ID`} value={item.id} />
            {children(item)}
        </> : <>
            {parentType && !scopedParentID ? parentItems?.map(p => <Fragment key={p.id}>
                <div className={styles.listHeading}>
                    <EditorButton icon={EXPR_VALUE_ICONS[parentType]} style='text' onClick={() => onSelectParent(p.id as EntityParentIDOf<T>)}>{p.name ? p.name : `Untitled ${prettyPrintIdentifier(parentType)}`}</EditorButton>
                </div>
                <div className={styles.itemList}>
                    {items.filter(i => getEntityParentID(type, i as EntityOfType<T>) === p.id).map(item => <EditorIcon key={item.id} path={EXPR_VALUE_ICONS[type]} label={item.name ? item.name : `Untitled ${prettyPrintIdentifier(type)}`} active={false} showLabel onClick={() => onSelectItem(item.id as EntityIDOf<T>)} />)}
                    <EditorIcon path={COMMON_ICONS.addItem} label={`New ${prettyPrintIdentifier(type)}`} showLabel onClick={() => onNewItem(p.id as EntityParentIDOf<T>)} />
                </div>
            </Fragment>) : <>
                <div className={styles.itemList}>
                    {items.map(item => <EditorIcon key={item.id} path={EXPR_VALUE_ICONS[type]} label={item.name ? item.name : `Untitled ${prettyPrintIdentifier(type)}`} active={false} showLabel onClick={() => onSelectItem(item.id as EntityIDOf<T>)} />)}
                    <EditorIcon path={COMMON_ICONS.addItem} label={`New ${prettyPrintIdentifier(type)}`} showLabel onClick={() => onNewItem(scopedParentID as EntityParentIDOf<T> | null)} />
                </div>
            </>}
        </>}
    </div>
}
