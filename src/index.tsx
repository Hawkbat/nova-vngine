import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './components/App'
import { LoadingApp } from './components/LoadingApp'
import { loadInitialGame } from './operations/player'
import { saveProject } from './operations/project'
import { loadInitialSettings } from './operations/settings'
import { getRoutePathFromViewState, loadInitialViewState, updateViewStateFromRoutePath } from './operations/viewState'
import { platform } from './platform/platform'
import { gamePlayerStore } from './store/player'
import { projectStore } from './store/project'
import { settingsStore } from './store/settings'
import { viewStateStore } from './store/viewstate'
import { isPlatformErrorCode } from './types/platform'
import { wait } from './utils/async'
import { openErrorDialog } from './utils/debug'
import { immReplaceBy, immSet } from './utils/imm'
import { subscribeToSelector, subscribeToStore, subscribeToStoreAsync } from './utils/store'

const appContainer = document.createElement('div')
appContainer.id = 'appContainer'
document.body.append(appContainer)

const appRoot = createRoot(appContainer)
appRoot.render(<StrictMode><LoadingApp /></StrictMode>)

window.addEventListener('unhandledrejection', (e) => void (async () => {
    await openErrorDialog(e.reason)
})())

window.addEventListener('dragover', e => {
    e.preventDefault()
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'none'
        e.dataTransfer.dropEffect = 'none'
    }
})
window.addEventListener('drop', e => {
    e.preventDefault()
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'none'
        e.dataTransfer.dropEffect = 'none'
    }
})

window.addEventListener('contextmenu', e => {
    e.preventDefault()
})

async function updateTitle() {
    const projectIsLoaded = !!viewStateStore.getSnapshot().loadedProject
    const name = projectStore.getSnapshot().name
    const isDirty = projectStore.isDirty()
    await platform.setTitle(`${projectIsLoaded ? `${name ? name : 'Untitled Project'}${isDirty ? ' *' : ''} - ` : ''}Nova VNgine (${platform.name})`)
}

async function initializeAll() {
    await platform.initialize()

    subscribeToStoreAsync(projectStore, async state => {
        const viewState = viewStateStore.getSnapshot()
        if (viewState.loadedProject) {
            const root = viewState.loadedProject.root
            try {
                await saveProject(root, state)
                await wait(1000)
                projectStore.setDirty(false)
            } catch (err) {
                if (isPlatformErrorCode(err, 'not-supported')) {
                    await wait(1000)
                }
            }
        }
    })

    subscribeToStoreAsync(viewStateStore, async state => {
        await platform.saveViewState(state)
        await wait(1000)
    })

    subscribeToStoreAsync(settingsStore, async state => {
        document.documentElement.style.fontSize = `${String(20 * state.uiScale)}px`

        await platform.saveSettings(state)
        await wait(1000)
    })

    subscribeToStoreAsync(gamePlayerStore, async state => {
        await platform.saveGame(state)
        await wait(1000)
    })

    subscribeToStoreAsync(viewStateStore, updateTitle)
    subscribeToStoreAsync(projectStore, updateTitle)
    subscribeToStoreAsync(projectStore.meta, updateTitle)
    await updateTitle()

    await loadInitialGame()
    await loadInitialSettings()
    await loadInitialViewState()

    subscribeToSelector(projectStore, s => s.name, name => {
        const viewState = viewStateStore.getSnapshot()
        if (viewState.loadedProject && viewState.loadedProject.name !== name) {
            viewStateStore.setValue(s => s.loadedProject ? immSet(s, 'loadedProject', immSet(s.loadedProject, 'name', name)) : s)
        }
        const recentProject = viewState.recentProjects.find(p => p.id === name)
        if (recentProject && recentProject.name !== name) {
            const updatedProject = { ...recentProject, name }
            viewStateStore.setValue(s => immSet(s, 'recentProjects', immReplaceBy(s.recentProjects, p => p.id, updatedProject)))
        }
    })

    subscribeToStore(viewStateStore, viewState => {
        location.hash = getRoutePathFromViewState(viewState)
    })

    window.addEventListener('hashchange', e => {
        const url = new URL(e.newURL)
        const path = url.hash.startsWith('#') ? url.hash.substring(1) : ''
        if (!path) return
        updateViewStateFromRoutePath(path)
    })

    appRoot.render(<StrictMode><App /></StrictMode>)
}

void initializeAll()
