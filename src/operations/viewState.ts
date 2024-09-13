import { useCallback } from 'react'

import { platform } from '../platform/platform'
import { getStorageProvider } from '../storage/storage'
import { viewStateStore } from '../store/viewstate'
import { DEFAULT_PROJECT_FILENAME, isPlatformErrorCode } from '../types/platform'
import { ENTITY_TYPES, type EntityIDOf, type EntityType, getEntityTypeByProjectKey, getEntityTypeHierarchy, getProjectEntityKey, parseProjectDefinition, PROJECT_ENTITY_KEYS } from '../types/project'
import { isStorageErrorCode, type StorageRootEntry } from '../types/storage'
import { PROJECT_EDITOR_TABS, type ProjectEditorTab, type ProjectMetaData, type ViewState } from '../types/viewstate'
import { arrayHead, isAnyOf } from '../utils/array'
import { existsFilter, tryParseJson } from '../utils/guard'
import { immAppend, immSet } from '../utils/imm'
import { useSelector } from '../utils/store'
import { hintTuple } from '../utils/types'
import { getEntityHierarchy, loadProject, parseProjectFromJson, tryLoadProject } from './project'

export function useViewStateTab() {
    const getTab = useSelector(viewStateStore, s => s.currentTab)
    const setTab = useCallback((tab: ProjectEditorTab) => {
        viewStateStore.setValue(s => immSet(s, 'currentTab', tab))
    }, [])
    return hintTuple(getTab, setTab)
}

export function useViewStateScope<T extends EntityType>(type: T | null): [() => EntityIDOf<T> | null, (id: EntityIDOf<T> | null) => void] {
    const getScopes = useSelector(viewStateStore, s => s.scopes)
    const getScope = useCallback(() => type ? getScopes()[type] as EntityIDOf<T> | null : null, [getScopes, type])
    const setScope = useCallback((id: EntityIDOf<T> | null) => {
        if (!type) return
        if (!id) {
            const subTypes = ENTITY_TYPES.filter(e => getEntityTypeHierarchy(e).includes(type))
            const scopeValues = Object.fromEntries(subTypes.map(t => hintTuple(t, null)))
            viewStateStore.setValue(s => ({ ...s, scopes: { ...s.scopes, ...scopeValues }, editor: null }))
            return
        }
        const hierarchy = getEntityHierarchy(type, id)
        const scopeValues = Object.fromEntries(hierarchy.map(h => hintTuple(h.type, h.entity.id)))
        viewStateStore.setValue(s => ({ ...s, scopes: { ...(Object.fromEntries(ENTITY_TYPES.map(t => hintTuple(t, null))) as Record<EntityType, null>), ...scopeValues }, editor: null }))
    }, [type])
    return hintTuple(getScope, setScope)
}

export async function loadInitialViewState() {
    const viewState = await platform.loadViewState()
    viewStateStore.setValue(() => viewState)
    const storage = getStorageProvider()
    if (storage.listLocalRoots) {
        const roots = await storage.listLocalRoots()
        const projects = (await Promise.all(roots.map(async r => {
            const existingProject = viewState.recentProjects.find(p => p.root.key === r.key)
            if (existingProject) return null
            const { files } = await storage.listDirectory(r, '')
            const projectFile = files.find(f => f.name === DEFAULT_PROJECT_FILENAME)
            if (projectFile) {
                const json = await projectFile.text()
                const parsed = tryParseJson(json, 'project', parseProjectDefinition)
                if (parsed.success) {
                    const metadata: ProjectMetaData = {
                        id: parsed.value.id,
                        name: parsed.value.name,
                        root: r,
                    }
                    return metadata
                } else {
                    void platform.error(parsed.ctx.errors)
                }
            }
            return null
        }))).filter(existsFilter)
        viewStateStore.setValue(s => immSet(s, 'recentProjects', immAppend(s.recentProjects, ...projects)))
    }
    try {
        if ('PUBLISHED_PROJECT' in window && PUBLISHED_PROJECT) {
            const root: StorageRootEntry = { type: 'fetch', key: PUBLISHED_PROJECT }
            const json = await getStorageProvider(root.type).loadText(root, DEFAULT_PROJECT_FILENAME)
            const project = parseProjectFromJson(json)
            if (!viewStateStore.getValue().recentProjects.find(p => p.id === project.id)) {
                const projectMetaData: ProjectMetaData = { id: project.id, name: project.name, root }
                viewStateStore.setValue(s => immSet(s, 'recentProjects', immAppend(s.recentProjects, projectMetaData)))
            }
            if (await tryLoadProject(root)) {
                viewStateStore.setValue(s => immSet(s, 'currentTab', 'play'))
                return
            }
        }
    } catch (err) {
        if (!isStorageErrorCode(err, 'not-found')) {
            console.error(err)
        }
    }
    try {
        if (viewState.loadedProject && await loadProject(viewState.loadedProject.root)) {
            return
        }
    } catch (err) {
        if (isPlatformErrorCode(err, 'bad-project')) {
            void platform.error('Failed to load previously loaded project', err)
        } else {
            throw err
        }
    }
    viewStateStore.setValue(s => ({
        ...s,
        currentTab: 'home',
        loadedProject: null,
        loaded: true,
    }))
}

export function getRoutePathFromViewState(viewState: ViewState) {
    const tab = viewState.currentTab
    if (isAnyOf(tab, PROJECT_ENTITY_KEYS)) {
        const entityType = getEntityTypeByProjectKey(tab)
        if (entityType) {
            const typeHierarchy = getEntityTypeHierarchy(entityType).reverse()
            for (const subType of typeHierarchy) {
                const id = viewState.scopes[subType]
                if (id) {
                    const hierarchy = getEntityHierarchy(subType, id)
                    const path = hierarchy.map(p => `${getProjectEntityKey(p.type)}/${p.entity.id}`).join('/')
                    return path.startsWith(tab) ? `/${path}/` : `/${tab}/${path}/`
                }
            }
        }
    }
    return `/${tab}/`
}

export function updateViewStateFromRoutePath(path: string) {
    if (path.startsWith('/')) path = path.substring(1)
    if (!path) return
    const parts = path.split('/')
    const tab = parts.shift()
    if (!tab || !isAnyOf(tab, PROJECT_EDITOR_TABS)) return
    const scopeReset = Object.fromEntries(ENTITY_TYPES.map(t => hintTuple(t, null))) as Record<EntityType, null>
    if (isAnyOf(tab, PROJECT_ENTITY_KEYS)) {
        const entityType = getEntityTypeByProjectKey(tab)
        console.log(tab, entityType,  path)
        if (entityType) {
            const typeHierarchy = getEntityTypeHierarchy(entityType)
            if (typeHierarchy[0] === entityType) {
                const id = arrayHead(parts)
                viewStateStore.setValue(s => ({ ...s, currentTab: tab, scopes: { ...scopeReset, [entityType]: id } }))
                return
            }
            let scopes = { ...viewStateStore.getValue().scopes, ...scopeReset }
            for (const t of typeHierarchy) {
                const projectKey = parts.shift()
                if (!projectKey) break
                const type = getEntityTypeByProjectKey(projectKey)
                if (!type) break
                if (type !== t) {
                    throw new Error(`Invalid entity path: ${path}`)
                }
                const id = parts.shift()
                if (!id) break
                scopes = { ...scopes, [type]: id }
            }
            viewStateStore.setValue(s => ({ ...s, currentTab: tab, scopes }))
            return
        }
    }
    viewStateStore.setValue(s => ({ ...s, currentTab: tab, scopes: scopeReset }))
}

