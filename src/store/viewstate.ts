import { useCallback } from "react"
import { ProjectEditorTab } from "../components/editors/ProjectEditor"
import { BackdropID, ChapterID, CharacterID, PortraitID, SceneID, SongID, SoundID, StoryID, VariableID } from "../types/definitions"
import { createSimpleStore, useSelector } from "../utils/store"
import { immSet } from "../utils/imm"
import { hintTypeTuple } from "../utils/types"
import { PlatformFilesystemEntry } from "../utils/platform/common"
import { platform } from "../utils/platform/platform"
import { projectStore } from "./project"

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
    scopes: {
        story?: StoryID
        chapter?: ChapterID
        scene?: SceneID
        character?: CharacterID
        portrait?: PortraitID
        backdrop?: BackdropID
        song?: SongID
        sound?: SoundID
        variable?: VariableID
    }
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
    }, [])
    return hintTypeTuple(tab, setTab)
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
