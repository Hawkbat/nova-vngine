import { settingsStore } from '../store/settings'
import { viewStateStore } from '../store/viewstate'
import type { Platform } from '../types/platform'
import { parseSettingsState } from '../types/settings'
import { parseViewState } from '../types/viewstate'
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
    async loadSettings() {
        const json = localStorage.getItem('nvn-settings')
        const parsed = tryParseJson(json ?? '', 'settings', parseSettingsState)
        if (parsed.ctx.warnings.length) void this.warn(parsed.ctx.warnings)
        if (!parsed.success) {
            void this.error('Failed to load settings', json, parsed.ctx.errors)
            return settingsStore.getSnapshot()
        }
        return parsed.value
    },
    async saveSettings(settings) {
        localStorage.setItem('nvn-settings', JSON.stringify(settings))
    },
    async setTitle(title) {
        document.title = title
    },
    async readFromClipboard() {
        const text = await navigator.clipboard.readText()
        if (!text) return null
        return text
    },
    async writeToClipboard(text) {
        await navigator.clipboard.writeText(text)
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
