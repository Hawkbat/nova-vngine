import { parseViewState } from '../types/viewstate'
import { viewStateStore } from '../store/viewstate'
import { parseProjectDefinition } from '../types/definitions'
import type { Platform } from '../types/platform'
import { DEFAULT_PROJECT_FILENAME, PlatformError } from '../types/platform'
import { tryParseJson } from '../utils/guard'
import { wait } from '../utils/async'

export const webPlatform: Platform = {
    name: 'Browser (Generic)',
    async initialize() {

    },
    async loadViewState() {
        const json = localStorage.getItem('nvn-viewstate')
        const parsed = tryParseJson(json ?? '', 'viewState', parseViewState)
        if (parsed.ctx.warnings.length) void this.warn(parsed.ctx.warnings)
        if (!parsed.success) {
            void this.error('Failed to load viewstate', json, parsed.ctx.errors)
            return viewStateStore.getSnapshot()
        }
        await wait(0)
        return parsed.value
    },
    async saveViewState(viewState) {
        localStorage.setItem('nvn-viewstate', JSON.stringify(viewState))
        await wait(0)
    },
    async loadProject(dir) {
        const res = await fetch(`${dir.path}/${DEFAULT_PROJECT_FILENAME}`)
        if (!res.ok) {
            if (res.status === 404) return null
            throw new PlatformError('bad-project', `Could not load project at ${dir.path}: ${String(res.status)} ${res.statusText}`)
        }
        const json = await res.text()
        const parsed = tryParseJson(json, 'project', parseProjectDefinition)
        if (parsed.ctx.warnings.length) void this.warn(parsed.ctx.warnings)
        if (!parsed.success) {
            void this.error('Failed to load project', json, parsed.ctx.errors)
            throw new PlatformError('bad-project', 'The project file was outdated or corrupted in a manner that has prevented it from loading.')
        }
        return parsed.value
    },
    async saveProject(dir, project) {
        await wait(0)
        throw new PlatformError('not-supported', 'Project saving is not supported in your current browser. Please use the desktop app, Chrome, or Edge.')
    },
    async createProject(dir) {
        await wait(0)
        throw new PlatformError('not-supported', 'Project creation is not supported in your current browser. Please use the desktop app, Chrome, or Edge.')
    },
    async setTitle(title) {
        document.title = title
        await wait(0)
    },
    async pickFiles(title, fileType, extensions, multi) {
        await wait(0)
        throw new PlatformError('not-supported', 'File picking is not supported in your current browser. Please use the desktop app, Chrome, or Edge.')
    },
    async pickDirectory(title) {
        await wait(0)
        throw new PlatformError('not-supported', 'Folder picking is not supported in your current browser. Please use the desktop app, Chrome, or Edge.')
    },
    async log(...objs) {
        console.log(...objs)
        await wait(0)
    },
    async warn(...objs) {
        console.warn(...objs)
        await wait(0)
    },
    async error(...objs) {
        console.error(...objs)
        await wait(0)
    },
}
