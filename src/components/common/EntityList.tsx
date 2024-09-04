import { Fragment } from 'react/jsx-dev-runtime'

import { useAsset } from '../../store/assets'
import { getEntityDisplayName, getEntityPrimaryAsset, immCreateEntity, immCreateVariable, useViewStateScope, useViewStateTab } from '../../store/operations'
import { projectStore } from '../../store/project'
import { type AnyVariableScope, type EntityIDOf, type EntityOfType, type EntityParentIDOf, type EntityParentOf, type EntityType, getEntityParentID, getEntityParentType, getProjectEntityKey, isVariableInScope, type ProjectDefinition } from '../../types/project'
import { prettyPrintIdentifier } from '../../utils/display'
import { useSelector } from '../../utils/store'
import { EditorButton } from './EditorButton'
import { EditorIcon } from './EditorIcon'
import { COMMON_ICONS, EXPR_VALUE_ICONS } from './Icons'

import styles from './EntityList.module.css'

export const VariableList = ({ scope }: { scope: AnyVariableScope }) => {
    return <EntityList<'variable'> type='variable' label={`Variables (${prettyPrintIdentifier(scope.type)})`} filter={v => isVariableInScope(v, scope)} createEntity={project => immCreateVariable(project, { ...scope })} />
}

const Item = <T extends EntityType>({ type, item }: { type: T, item: EntityOfType<T> }) => {
    const [, setScope] = useViewStateScope(type)
    const [, setCurrentTab] = useViewStateTab()
    const projectKey = getProjectEntityKey(type)
    const asset = getEntityPrimaryAsset(type, item)
    const getAssetUrl = useAsset(asset, true)

    const onSelectItem = (id: EntityIDOf<T>) => {
        setScope(id)
        setCurrentTab(projectKey)
    }

    return <EditorIcon key={item.id} path={getAssetUrl() ?? EXPR_VALUE_ICONS[type]} label={getEntityDisplayName(type, item, false)} active={false} showLabel onClick={() => onSelectItem(item.id as EntityIDOf<T>)} />
}

export const EntityList = <T extends EntityType>({ type, label, filter, createEntity }: {
    type: T
    label?: string
    filter?: (entity: EntityOfType<T>) => boolean
    createEntity?: (project: ProjectDefinition, parentID?: EntityParentIDOf<T> | null) => [ProjectDefinition, EntityOfType<T>]
}) => {
    const parentType = getEntityParentType(type)
    const projectKey = getProjectEntityKey(type)
    const [, setScope] = useViewStateScope(type)
    const [, setCurrentTab] = useViewStateTab()
    const [getScopedParentID, setParentScope] = useViewStateScope(parentType)
    const getItems = useSelector(projectStore, s => s[projectKey]) as () => EntityOfType<T>[]
    const getParentItems = useSelector(projectStore, s => parentType ? s[getProjectEntityKey(parentType)] : null) as () => EntityOfType<EntityParentOf<T>>[] | null

    const onNewItem = (parentID?: EntityParentIDOf<T> | null) => {
        const [project, item] = createEntity ? createEntity(projectStore.getSnapshot(), parentID) : immCreateEntity(type, projectStore.getSnapshot(), parentID)
        projectStore.setValue(() => project)
        setScope(item.id as EntityIDOf<T>)
    }

    const onSelectParent = (parentID: EntityParentIDOf<T>) => {
        if (!parentType) return
        setParentScope(parentID)
        setCurrentTab(projectKey)
    }

    return <div className={styles.list}>
        <div className={styles.heading}>{label ? label : prettyPrintIdentifier(projectKey)}</div>
        {parentType && getScopedParentID() ? <>
            <div className={styles.items}>
                {getItems().filter(i => filter ? filter(i) : true).filter(i => getEntityParentID(type, i as EntityOfType<T>) === getScopedParentID() as EntityParentIDOf<T> | null).map(item => <Item key={item.id} type={type} item={item} />)}
                <EditorIcon path={COMMON_ICONS.addItem} label={`New ${prettyPrintIdentifier(type)}`} showLabel onClick={() => onNewItem(getScopedParentID() as EntityParentIDOf<T> | null)} />
            </div>
        </> : parentType ? getParentItems()?.map(p => <Fragment key={p.id}>
            <div className={styles.heading}>
                <EditorButton icon={EXPR_VALUE_ICONS[parentType]} style='text' onClick={() => onSelectParent(p.id as EntityParentIDOf<T>)}>{getEntityDisplayName(parentType, p, true)}</EditorButton>
            </div>
            <div className={styles.items}>
                {getItems().filter(i => filter ? filter(i) : true).filter(i => getEntityParentID(type, i as EntityOfType<T>) === p.id).map(item => <Item key={item.id} type={type} item={item} />)}
                <EditorIcon path={COMMON_ICONS.addItem} label={`New ${prettyPrintIdentifier(type)}`} showLabel onClick={() => onNewItem(p.id as EntityParentIDOf<T>)} />
            </div>
        </Fragment>) ?? null : <div className={styles.items}>
            {getItems().filter(i => filter ? filter(i) : true).map(item => <Item key={item.id} type={type} item={item} />)}
            <EditorIcon path={COMMON_ICONS.addItem} label={`New ${prettyPrintIdentifier(type)}`} showLabel onClick={() => onNewItem(getScopedParentID() as EntityParentIDOf<T> | null)} />
        </div>}
    </div>
}
