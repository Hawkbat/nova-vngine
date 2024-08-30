import { parseViewState } from '../types/viewstate'
import { viewStateStore } from '../store/viewstate'
import type { Platform } from '../types/platform'
import { tryParseJson } from '../utils/guard'

export const webPlatform: Platform = {
    type: 'web',
    name: 'Browser',
    isSupported() {
        return true
    },
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
        return parsed.value
    },
    async saveViewState(viewState) {
        localStorage.setItem('nvn-viewstate', JSON.stringify(viewState))
    },
    async setTitle(title) {
        document.title = title
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
