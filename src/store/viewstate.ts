import { useCallback } from "react"
import { ProjectEditorTab } from "../components/editors/ProjectEditor"
import { ENTITY_TYPES, EntityIDOf, EntityOfType, EntityType, getEntityTypeHierarchy } from "../types/definitions"
import { createSimpleStore, useSelector } from "../utils/store"
import { immSet } from "../utils/imm"
import { hintTypeTuple } from "../utils/types"
import { PlatformFilesystemEntry } from "../utils/platform/common"
import { platform } from "../utils/platform/platform"
import { getEntityHierarchy, projectStore } from "./project"

export interface ProjectMetaData {
    id: string
    name: string
    directory: PlatformFilesystemEntry
}

export interface ViewState {
    loaded: boolean
    currentTab: ProjectEditorTab
    loadedProject: ProjectMetaData | null
    recentProjects: ProjectMetaData[]
    scopes: { [K in EntityType]?: EntityOfType<K>['id'] }
}

export const viewStateStore = createSimpleStore<ViewState>({
    loaded: false,
    currentTab: 'home',
    loadedProject: null,
    recentProjects: [],
    scopes: {},
})

export function useViewStateTab() {
    const [tab, setViewState] = useSelector(viewStateStore, s => s.currentTab)
    const setTab = useCallback((tab: ProjectEditorTab) => {
        setViewState(s => immSet(s, 'currentTab', tab))
    }, [setViewState])
    return hintTypeTuple(tab, setTab)
}

export function useViewStateScope<T extends EntityType>(type: T | null) {
    const [scopes, setViewState] = useSelector(viewStateStore, s => s.scopes)
    const scope = type ? scopes[type] : null
    const setScope = useCallback((id: EntityIDOf<T> | undefined) => {
        if (!type) return
        if (!id) {
            const subTypes = ENTITY_TYPES.filter(e => getEntityTypeHierarchy(e).includes(type))
            const scopeValues = Object.fromEntries(subTypes.map(t => hintTypeTuple(t, undefined)))
            setViewState(s => ({ ...s, scopes: { ...s.scopes, ...scopeValues } }))
            return
        }
        const hierarchy = getEntityHierarchy(type, id)
        const scopeValues = Object.fromEntries(hierarchy.map(h => hintTypeTuple(h.type, h.entity.id)))
        setViewState(s => ({ ...s, scopes: { ...s.scopes, ...scopeValues } }))
    }, [setViewState, type])
    return hintTypeTuple(scope, setScope)
}

export async function loadInitialViewState() {
    const viewState = await platform.loadViewState()
    viewStateStore.setValue(() => viewState)
    if (viewState.loadedProject && await loadProjectFromFolder(viewState.loadedProject.directory)) {
        return
    }
    viewStateStore.setValue(s => ({
        ...s,
        currentTab: 'home',
        loadedProject: null,
        loaded: true,
    }))
}

export async function loadProjectFromFolder(dir: PlatformFilesystemEntry) {
    const project = await platform.loadProject(dir)
    if (!project) return false
    
    const projectMetaData: ProjectMetaData = { id: project.id, name: project.name, directory: dir }

    viewStateStore.setValue(viewState => ({
        ...viewState,
        loadedProject: projectMetaData,
        recentProjects: viewState.recentProjects.filter(p => p.id !== projectMetaData.id).concat([projectMetaData])
    }))
    projectStore.setValue(() => project)
    projectStore.clearHistory()
    projectStore.setDirty(false)
    return true
}
