import { useCallback } from 'react'

import { platform } from '../platform/platform'
import { getStorageProvider } from '../storage/storage'
import { viewStateStore } from '../store/viewstate'
import { DEFAULT_PROJECT_FILENAME, isPlatformErrorCode } from '../types/platform'
import { ENTITY_TYPES, type EntityIDOf, type EntityType, getEntityTypeHierarchy, parseProjectDefinition } from '../types/project'
import { isStorageErrorCode, type StorageRootEntry } from '../types/storage'
import type { ProjectEditorTab, ProjectMetaData } from '../types/viewstate'
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
        viewStateStore.setValue(s => ({ ...s, scopes: { ...s.scopes, ...scopeValues }, editor: null }))
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

