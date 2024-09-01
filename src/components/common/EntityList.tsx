import { Fragment } from 'react/jsx-dev-runtime'
import { useViewStateScope, immCreateEntity, useViewStateTab } from '../../store/operations'
import { projectStore } from '../../store/project'
import { type EntityType, getEntityParentType, getProjectEntityKey, type EntityParentIDOf, type EntityIDOf, getEntityParentID, type EntityOfType, type EntityParentOf } from '../../types/project'
import { prettyPrintIdentifier } from '../../utils/display'
import { useSelector } from '../../utils/store'
import { EditorButton } from './EditorButton'
import { EditorIcon } from './EditorIcon'
import { EXPR_VALUE_ICONS, COMMON_ICONS } from './Icons'
import styles from './EntityList.module.css'

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export const EntityList = <T extends EntityType>({ type }: {
    type: T
}) => {
    const parentType = getEntityParentType(type)
    const projectKey = getProjectEntityKey(type)
    const [, setScope] = useViewStateScope(type)
    const [, setCurrentTab] = useViewStateTab()
    const [getScopedParentID, setParentScope] = useViewStateScope(parentType)
    const getItems = useSelector(projectStore, s => s[projectKey]) as () => EntityOfType<T>[]
    const getParentItems = useSelector(projectStore, s => parentType ? s[getProjectEntityKey(parentType)] : null) as () => EntityOfType<EntityParentOf<T>>[] | null

    const onNewItem = (parentID?: EntityParentIDOf<T> | null) => {
        if (parentType) {
            if (!parentID) return
            const [project, item] = immCreateEntity(type, projectStore.getSnapshot(), parentID)
            projectStore.setValue(() => project)
            setScope(item.id as EntityIDOf<T>)
        } else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const [project, item] = immCreateEntity(type, projectStore.getSnapshot(), parentID!)
            projectStore.setValue(() => project)
            setScope(item.id as EntityIDOf<T>)
        }
    }

    const onSelectParent = (parentID: EntityParentIDOf<T>) => {
        if (!parentType) return
        setParentScope(parentID)
        setCurrentTab(projectKey)
    }

    const onSelectItem = (id: EntityIDOf<T>) => {
        setScope(id)
        setCurrentTab(projectKey)
    }

    const Item = ({ item }: { item: EntityOfType<T> }) => <EditorIcon key={item.id} path={EXPR_VALUE_ICONS[type]} label={item.name ? item.name : `Untitled ${prettyPrintIdentifier(type)}`} active={false} showLabel onClick={() => onSelectItem(item.id as EntityIDOf<T>)} />

    return <div className={styles.list}>
        <div className={styles.heading}>{prettyPrintIdentifier(projectKey)}</div>
        {parentType && getScopedParentID() ? <>
            <div className={styles.items}>
                {getItems().filter(i => getEntityParentID(type, i as EntityOfType<T>) === getScopedParentID() as EntityParentIDOf<T> | null).map(item => <Item key={item.id} item={item} />)}
                <EditorIcon path={COMMON_ICONS.addItem} label={`New ${prettyPrintIdentifier(type)}`} showLabel onClick={() => onNewItem(getScopedParentID() as EntityParentIDOf<T> | null)} />
            </div>
        </> : parentType ? getParentItems()?.map(p => <Fragment key={p.id}>
            <div className={styles.heading}>
                <EditorButton icon={EXPR_VALUE_ICONS[parentType]} style='text' onClick={() => onSelectParent(p.id as EntityParentIDOf<T>)}>{p.name ? p.name : `Untitled ${prettyPrintIdentifier(parentType)}`}</EditorButton>
            </div>
            <div className={styles.items}>
                {getItems().filter(i => getEntityParentID(type, i as EntityOfType<T>) === p.id).map(item => <EditorIcon key={item.id} path={EXPR_VALUE_ICONS[type]} label={item.name ? item.name : `Untitled ${prettyPrintIdentifier(type)}`} active={false} showLabel onClick={() => onSelectItem(item.id as EntityIDOf<T>)} />)}
                <EditorIcon path={COMMON_ICONS.addItem} label={`New ${prettyPrintIdentifier(type)}`} showLabel onClick={() => onNewItem(p.id as EntityParentIDOf<T>)} />
            </div>
        </Fragment>) ?? null : <div className={styles.items}>
            {getItems().map(item => <EditorIcon key={item.id} path={EXPR_VALUE_ICONS[type]} label={item.name ? item.name : `Untitled ${prettyPrintIdentifier(type)}`} active={false} showLabel onClick={() => onSelectItem(item.id as EntityIDOf<T>)} />)}
            <EditorIcon path={COMMON_ICONS.addItem} label={`New ${prettyPrintIdentifier(type)}`} showLabel onClick={() => onNewItem(getScopedParentID() as EntityParentIDOf<T> | null)} />
        </div>}
    </div>
}
