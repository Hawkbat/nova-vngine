import { parseViewState } from "../types/viewstate"
import { viewStateStore } from "../store/viewstate"
import { parseProjectDefinition } from "../types/definitions"
import type { Platform } from "../types/platform"
import { DEFAULT_PROJECT_FILENAME, PlatformError } from "../types/platform"
import { tryParseJson } from "../utils/guard"

export const webPlatform: Platform = {
    name: 'Browser (Generic)',
    async initialize() {

    },
    async loadViewState() {
        const json = localStorage.getItem('nvn-viewstate')
        const parsed = tryParseJson(json ?? '', 'viewState', parseViewState)
        if (parsed.ctx.warnings.length) this.warn(parsed.ctx.warnings)
        if (!parsed.success) {
            this.error('Failed to load viewstate', json, parsed.ctx.errors)
            return viewStateStore.getSnapshot()
        }
        return parsed.value
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
        const json = await res.text()
        const parsed = tryParseJson(json, 'project', parseProjectDefinition)
        if (parsed.ctx.warnings.length) this.warn(parsed.ctx.warnings)
        if (!parsed.success) {
            this.error('Failed to load project', json, parsed.ctx.errors)
            throw new PlatformError('bad-project', `The project file was outdated or corrupted in a manner that has prevented it from loading.`)
        }
        return parsed.value
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
    async log(...objs) {
        console.log(...objs)
    },
    async warn(...objs) {
        console.warn(...objs)
    },
    async error(...objs) {
        console.error(...objs)
    },
}
