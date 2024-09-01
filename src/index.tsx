import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './components/App'
import { viewStateStore } from './store/viewstate'
import { loadInitialSettings, loadInitialViewState, saveProject } from './store/operations'
import { projectStore } from './store/project'
import { wait } from './utils/async'
import { immSet, immReplaceBy } from './utils/imm'
import { subscribeToStoreAsync, subscribeToSelector } from './utils/store'
import { LoadingApp } from './components/LoadingApp'
import { platform } from './platform/platform'
import { settingsStore } from './store/settings'
import { openErrorDialog } from './utils/debug'

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
            await saveProject(root, state)
            await wait(1000)
            projectStore.setDirty(false)
        }
    })

    subscribeToStoreAsync(viewStateStore, async state => {
        await platform.saveViewState(state)
        await wait(1000)
    })

    subscribeToStoreAsync(settingsStore, async state => {
        await platform.saveSettings(state)
        await wait(1000)
    })

    subscribeToStoreAsync(viewStateStore, updateTitle)
    subscribeToStoreAsync(projectStore, updateTitle)
    subscribeToStoreAsync(projectStore.meta, updateTitle)
    await updateTitle()

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

    await loadInitialSettings()
    await loadInitialViewState()

    appRoot.render(<StrictMode><App /></StrictMode>)
}

void initializeAll()
