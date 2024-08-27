import type { EntityOfType, EntityType, ProjectEntityKeyOf } from "../types/definitions"
import { createSimpleStore } from "../utils/store"
import type { PlatformFilesystemEntry } from "../utils/platform/common"

export type ProjectEditorTab = 'home' | 'manual' | 'settings' | 'project' | ProjectEntityKeyOf<EntityType>

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
