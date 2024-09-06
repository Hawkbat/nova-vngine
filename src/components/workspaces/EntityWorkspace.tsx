import { Fragment } from 'react/jsx-dev-runtime'

import { getEntityByID, getEntityDisplayName, getEntityPrimaryAsset, getEntityReferences } from '../../operations/project'
import { useViewStateScope } from '../../operations/viewState'
import { useAsset } from '../../store/assets'
import { projectStore } from '../../store/project'
import { settingsStore } from '../../store/settings'
import { viewStateStore } from '../../store/viewstate'
import type { AnyEntity, AnyVariableScope, EntityIDOf, EntityOfType, EntityType, ProjectDefinition, ProjectEntityKeyOf  } from '../../types/project'
import { getEntityChildTypes, getProjectEntityKey  } from '../../types/project'
import { prettyPrintIdentifier } from '../../utils/display'
import { immRemoveWhere, immReplaceWhere, immSet } from '../../utils/imm'
import { useSelector } from '../../utils/store'
import { openDialog } from '../common/Dialog'
import { EditorButton, EditorButtonGroup } from '../common/EditorButton'
import { EntityList, VariableList } from '../common/EntityList'
import { Field } from '../common/Field'
import { EXPR_ICONS } from '../common/Icons'
import { StringField } from '../common/StringField'

import styles from './EntityWorkspace.module.css'

const EntityImagePreview = <T extends EntityType>({ type, entity }: { type: T, entity: EntityOfType<T> }) => {
    const asset = getEntityPrimaryAsset(type, entity)
    const getImgSrc = useAsset(asset, false)
    return getImgSrc() ? <img src={getImgSrc() ?? undefined} className={styles.previewImage} /> : null
}

export const EntityWorkspace = <T extends EntityType>({ type, children, getVariableScopes }: {
    type: T
    children: (item: EntityOfType<T>, setItem: (setter: (value: EntityOfType<T>) => EntityOfType<T>) => void) => React.ReactNode
    getVariableScopes?: (item: EntityOfType<T>) => AnyVariableScope[]
}) => {
    const getDeveloperMode = useSelector(settingsStore, s => s.developerMode)
    const projectKey = getProjectEntityKey(type)
    const [getItemID] = useViewStateScope(type)
    const getItems = useSelector(projectStore, s => s[projectKey])

    const childTypes = getEntityChildTypes(type)

    const item = (getItemID() ? getItems().find(s => s.id === getItemID()) ?? null : null) as EntityOfType<T> | null
    const asset = item ? getEntityPrimaryAsset(type, item) : null

    const variableScopes = item ? getVariableScopes?.(item) : null

    const references = item ? getEntityReferences(item.id) : []

    const onDeleteItem = () => {
        const name = getEntityDisplayName(type, item, false)
        void (async () => {
            const result = await openDialog(`Deleting ${name}`, `Are you sure you want to delete ${name}? This operation cannot be undone.`, { cancel: 'Cancel', delete: 'Delete' })
            if (result === 'delete') {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
                projectStore.setValue(p => immSet(p, projectKey, immRemoveWhere<AnyEntity>(p[projectKey], e => e.id === item?.id) as any))
            }
        })()
    }

    return item ? <Fragment key={item.id}>
        <div className={styles.fields}>
            <StringField label={`${prettyPrintIdentifier(type)} Name`} value={item.name} setValue={name => projectStore.setValue(project => immSet(project, projectKey, immReplaceWhere(project[projectKey] as EntityOfType<T>[], s => s.id === getItemID(), item => immSet(item, 'name', name)) as ProjectDefinition[ProjectEntityKeyOf<T>]))} validate={s => s ? '' : 'Name must be filled out'} />
            {getDeveloperMode() ? <>
                <StringField label={`${prettyPrintIdentifier(type)} ID`} value={item.id} />
            </> : null}
            {children(item, setter => projectStore.setValue(project => immSet(project, projectKey, immReplaceWhere(project[projectKey] as EntityOfType<T>[], s => s.id === getItemID(), e => setter(e)) as ProjectDefinition[ProjectEntityKeyOf<T>])))}
            {childTypes.length || variableScopes?.length ? <div className={styles.childLists}>
                {childTypes.map(c => <EntityList key={c} type={c} />)}
                {variableScopes?.map(s => <VariableList key={s.type} scope={s} />)}
            </div> : null}
            <Field label='Referenced By'>
                {references.length ? references.map(r => <EditorButton key={r.id} style='text' icon={EXPR_ICONS[r.type]} onClick={() => viewStateStore.setValue(v => immSet(immSet(v, 'scopes', immSet(v.scopes, r.type, r.id as EntityIDOf<EntityType>)), 'currentTab', getProjectEntityKey(r.type)))}>{getEntityDisplayName(r.type, getEntityByID(r.type, r.id as EntityIDOf<EntityType>), true)}</EditorButton>) : <>Nothing</>}
            </Field>
            <EditorButtonGroup side='left'>
                <EditorButton disabled={references.length > 0} onClick={onDeleteItem}>Delete {prettyPrintIdentifier(type)} {getEntityDisplayName(type, item, false)}</EditorButton>
            </EditorButtonGroup>
        </div>
        {asset ? <div className={styles.preview}>
            <EntityImagePreview type={type} entity={item} />
        </div> : null}
    </Fragment> : <>
        <EntityList type={type} />
    </>
}
