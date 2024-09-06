import { Fragment } from 'react/jsx-dev-runtime'

import { getEntityByID, getEntityDisplayName, getEntityPrimaryAsset, immCreateEntity, immCreateVariable } from '../../operations/project'
import { useViewStateScope, useViewStateTab } from '../../operations/viewState'
import { useAsset } from '../../store/assets'
import { projectStore } from '../../store/project'
import { type AnyVariableScope, type EntityIDOf, type EntityOfType, type EntityParentIDOf, type EntityParentOf, type EntityType, getEntityParentID, getEntityParentType, getProjectEntityKey, isVariableInScope, type ProjectDefinition } from '../../types/project'
import { prettyPrintIdentifier } from '../../utils/display'
import { useSelector } from '../../utils/store'
import { EditorButton } from './EditorButton'
import { EditorIcon } from './EditorIcon'
import { COMMON_ICONS, EXPR_VALUE_ICONS } from './Icons'

import styles from './EntityList.module.css'

export const VariableList = ({ scope, hideEmpty }: { scope: AnyVariableScope, hideEmpty?: boolean }) => {
    const getLabel = (scope: AnyVariableScope) => {
        switch (scope.type) {
            case 'stories':
            case 'chapters':
            case 'scenes':
            case 'characters':
            case 'macros':
                return `Multiple ${prettyPrintIdentifier(scope.type)}`
            case 'story': return getEntityDisplayName('story', getEntityByID('story', scope.value), true)
            case 'chapter': return getEntityDisplayName('chapter', getEntityByID('chapter', scope.value), true)
            case 'scene': return getEntityDisplayName('scene', getEntityByID('scene', scope.value), true)
            case 'character': return getEntityDisplayName('character', getEntityByID('character', scope.value), true)
            case 'macro': return getEntityDisplayName('macro', getEntityByID('macro', scope.value), true)
            default: return prettyPrintIdentifier(scope.type)
        }
    }
    return <EntityList<'variable'> type='variable' label={`Variables (${getLabel(scope)})`} filter={v => isVariableInScope(v, scope)} createEntity={project => immCreateVariable(project, { ...scope })} hideEmpty={hideEmpty} />
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

export const EntityList = <T extends EntityType>({ type, label, filter, createEntity, hideEmpty }: {
    type: T
    label?: string
    filter?: (entity: EntityOfType<T>) => boolean
    createEntity?: (project: ProjectDefinition, parentID?: EntityParentIDOf<T> | null) => [ProjectDefinition, EntityOfType<T>]
    hideEmpty?: boolean
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

    const items = getItems().filter(i => filter ? filter(i) : true).sort((a, b) => a.name.localeCompare(b.name))

    return !hideEmpty || items.length ? <div className={styles.list}>
        <div className={styles.heading}>{label ? label : prettyPrintIdentifier(projectKey)}</div>
        {parentType && getScopedParentID() ? <>
            <div className={styles.items}>
                {items.filter(i => getEntityParentID(type, i as EntityOfType<T>) === getScopedParentID() as EntityParentIDOf<T> | null).map(item => <Item key={item.id} type={type} item={item} />)}
                <EditorIcon path={COMMON_ICONS.addItem} label={`New ${prettyPrintIdentifier(type)}`} showLabel onClick={() => onNewItem(getScopedParentID() as EntityParentIDOf<T> | null)} />
            </div>
        </> : parentType ? getParentItems()?.map(p => <Fragment key={p.id}>
            <div className={styles.heading}>
                <EditorButton icon={EXPR_VALUE_ICONS[parentType]} style='text' onClick={() => onSelectParent(p.id as EntityParentIDOf<T>)}>{getEntityDisplayName(parentType, p, true)}</EditorButton>
            </div>
            <div className={styles.items}>
                {items.filter(i => getEntityParentID(type, i as EntityOfType<T>) === p.id).map(item => <Item key={item.id} type={type} item={item} />)}
                <EditorIcon path={COMMON_ICONS.addItem} label={`New ${prettyPrintIdentifier(type)}`} showLabel onClick={() => onNewItem(p.id as EntityParentIDOf<T>)} />
            </div>
        </Fragment>) ?? null : <div className={styles.items}>
            {items.map(item => <Item key={item.id} type={type} item={item} />)}
            <EditorIcon path={COMMON_ICONS.addItem} label={`New ${prettyPrintIdentifier(type)}`} showLabel onClick={() => onNewItem(getScopedParentID() as EntityParentIDOf<T> | null)} />
        </div>}
    </div> : <></>
}
