import type { ViewState } from '../types/viewstate'
import { createSimpleStore } from '../utils/store'

export const viewStateStore = createSimpleStore<ViewState>({
    loaded: false,
    currentTab: 'home',
    loadedProject: null,
    recentProjects: [],
    scopes: {
        story: null,
        chapter: null,
        scene: null,
        character: null,
        portrait: null,
        backdrop: null,
        song: null,
        sound: null,
        variable: null,
        macro: null,
    },
})


