import { viewStateStore, ViewState } from "../../store/viewstate"
import { ProjectDefinition } from "../../types/definitions"
import { Platform, DEFAULT_PROJECT_FILENAME, PlatformError } from "./common"

export const webPlatform: Platform = {
    name: 'Browser (Generic)',
    async initialize() {

    },
    async loadViewState() {
        const json = localStorage.getItem('nvn-viewstate')
        if (!json) return viewStateStore.getSnapshot()
        const viewState = JSON.parse(json) as ViewState
        return viewState
    },
    async saveViewState(viewState) {
        localStorage.setItem('nvn-viewstate', JSON.stringify(viewState))
    },
    async loadProject(dir) {
        const res = await fetch(`${dir.path}/${DEFAULT_PROJECT_FILENAME}`)
        if (!res.ok) {
            if (res.status === 404) return null
            throw new PlatformError('bad-project', `Could not load project at ${dir.path}: ${res.status} ${res.statusText}`)
        }
        const project = await res.json() as ProjectDefinition
        return project
    },
    async saveProject(dir, project) {
        throw new PlatformError('not-supported', `Project saving is not supported in your current browser. Please use the desktop app, Chrome, or Edge.`)
    },
    async createProject(dir) {
        throw new PlatformError('not-supported', `Project creation is not supported in your current browser. Please use the desktop app, Chrome, or Edge.`)
    },
    async setTitle(title) {
        document.title = title
    },
    async pickFiles(title, fileType, extensions, multi) {
        throw new PlatformError('not-supported', `File picking is not supported in your current browser. Please use the desktop app, Chrome, or Edge.`)
    },
    async pickDirectory(title) {
        throw new PlatformError('not-supported', `Folder picking is not supported in your current browser. Please use the desktop app, Chrome, or Edge.`)
    },
}
