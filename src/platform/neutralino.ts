import type { KnownPath, LoggerType } from '@neutralinojs/lib'
import { app as nApp, clipboard as nClipboard, debug as nDebug, events as nEvents, filesystem as nFS, init, os as nOS, window as nWindow } from '@neutralinojs/lib'

import { LOG_FILE_WRITES } from '../debug'
import faviconUrl from '../favicon.png'
import { gamePlayerStore } from '../store/player'
import { settingsStore } from '../store/settings'
import { viewStateStore } from '../store/viewstate'
import type { Platform } from '../types/platform'
import { parseGameState } from '../types/player'
import { parseSettingsState } from '../types/settings'
import { StorageError } from '../types/storage'
import { parseViewState } from '../types/viewstate'
import { awaitAllMap, createExposedPromise } from '../utils/async'
import { tryParseJson } from '../utils/guard'
import { inlineThrow } from '../utils/types'

const APP_DIR_NAME = '/Nova VNgine'

const initPromise = createExposedPromise()
let initialized = false

interface NativeError {
    code: string
    message: string
}

export async function waitForNeutralinoInit() {
    if (!initialized) await initPromise.promise
}

export function isNeutralinoError(err: unknown): err is NativeError {
    return !!err && typeof err === 'object' && 'code' in err && typeof err.code === 'string' && 'message' in err && typeof err.message === 'string'
}

async function setTitle(title: string) {
    document.title = title
    await waitForNeutralinoInit()
    await nWindow.setTitle(title)
}

export async function ensureParentDirectories(path: string) {
    const pathInfo = await nFS.getPathParts(path)
    try {
        const parentStats = await nFS.getStats(pathInfo.parentPath)
        if (!parentStats.isDirectory) throw new StorageError('not-found', 'Parent path is a file, not a directory')
    } catch (err) {
        if (isNeutralinoError(err) && err.code === 'NE_FS_NOPATHE') {
            await nFS.createDirectory(pathInfo.parentPath)
        } else {
            throw err
        }
    }
}

async function readFile(path: string): Promise<string | null> {
    await waitForNeutralinoInit()
    try {
        return await nFS.readFile(path)
    } catch (err) {
        if (isNeutralinoError(err) && err.code === 'NE_FS_FILRDER') return null
        throw err
    }
}

async function writeFile(path: string, text: string): Promise<boolean> {
    await waitForNeutralinoInit()
    await ensureParentDirectories(path)
    if (LOG_FILE_WRITES) {
        void neutralinoPlatform.log('Writing file', path)
    }
    try {
        await nFS.writeFile(path, text)
        return true
    } catch (err) {
        if (isNeutralinoError(err) && err.code === 'NE_FS_FILWRER') return false
        throw err
    }
}

async function getSafePath(path: KnownPath) {
    try {
        return await nOS.getPath(path)
    } catch (err) {
        if (isNeutralinoError(err) && err.code === 'NE_OS_INVKNPT') return null
        throw err
    }
}

async function getConfigFolderPath() {
    return `${await getSafePath('config') ?? await getSafePath('documents') ?? inlineThrow(new Error('No valid path for saving app configuration files was found.'))}${APP_DIR_NAME}`
}

async function _getStandardPaths() {
    await waitForNeutralinoInit()
    const paths = await awaitAllMap({
        cache: getSafePath('cache'), // %USER%/AppData/Local
        config: getSafePath('config'), // %USER%/AppData/Roaming
        data: getSafePath('data'), // %USER%/AppData/Roaming
        documents: getSafePath('documents'), // Documents (respects library folder)
        downloads: getSafePath('downloads'), // Downloads (respects library folder)
        music: getSafePath('music'), // Music (respects library folder)
        pictures: getSafePath('pictures'), // Pictures (respects library folder)
        savedGames1: getSafePath('savedGames1'), // null on Windows?
        savedGames2: getSafePath('savedGames2'), // null on Windows?
        temp: getSafePath('temp'), // %USER%/AppData/Local/Temp
        video: getSafePath('video'), // Videos (respects library folder)
    })
    return paths
}

type TrayItem = { id: string, text: string, isDisabled?: boolean, isChecked?: boolean, onClick?: () => void } | { id?: undefined, isDisabled?: undefined, isChecked?: undefined, text: '-', onClick?: undefined }

let menuItems: TrayItem[] = []

async function setTray(newMenuItems: TrayItem[]) {
    menuItems = newMenuItems
    await waitForNeutralinoInit()
    try {
        await nOS.setTray({
            icon: `/resources/${faviconUrl.slice(1)}`,
            menuItems,
        })
    } catch (err) {
        if (isNeutralinoError(err) && err.code === 'NE_OS_TRAYIER') return
        throw err
    }
}

async function exitApplication() {
    await waitForNeutralinoInit()
    await nApp.exit()
}

export const neutralinoPlatform: Platform = {
    type: 'neutralino',
    name: 'Desktop',
    isSupported() {
        return 'NL_APPID' in window
    },
    async initialize() {
        init()

        initialized = true
        initPromise.resolve()

        await nEvents.on('windowClose', (e: CustomEvent<null>) => {
            void nApp.exit()
        })

        await nEvents.on('trayMenuItemClicked', (e: CustomEvent<nOS.TrayMenuItem>) => {
            const menuItem = menuItems.find(i => i.id === e.detail.id)
            if (menuItem && menuItem.onClick) menuItem.onClick()
        })

        await nWindow.setIcon(`/resources/${faviconUrl.slice(1)}`)

        await setTray([
            { id: '', isDisabled: true, text: 'Nova VNgine' },
            { text: '-' },
            { id: 'checkUpdates', text: 'Check for Updates', onClick: () => { } },
            { text: '-' },
            { id: 'exit', text: 'Exit', onClick: () => void exitApplication() },
        ])
    },
    async loadViewState() {
        const path = `${await getConfigFolderPath()}/viewstate.json`
        const json = await readFile(path)
        const parsed = tryParseJson(json ?? '', 'viewstate', parseViewState)
        if (parsed.ctx.warnings.length) void this.warn(parsed.ctx.warnings)
        if (!parsed.success) {
            void this.error('Failed to load viewstate', json, parsed.ctx.errors)
            return viewStateStore.getSnapshot()
        }
        return parsed.value
    },
    async saveViewState(viewState) {
        const path = `${await getConfigFolderPath()}/viewstate.json`
        const json = JSON.stringify(viewState, undefined, 2)
        if (!await writeFile(path, json)) {
            void this.error('Failed to save viewstate', path, json)
        }
    },
    async loadSettings() {
        const path = `${await getConfigFolderPath()}/settings.json`
        const json = await readFile(path)
        const parsed = tryParseJson(json ?? '', 'settings', parseSettingsState)
        if (parsed.ctx.warnings.length) void this.warn(parsed.ctx.warnings)
        if (!parsed.success) {
            void this.error('Failed to load settings', json, parsed.ctx.errors)
            return settingsStore.getSnapshot()
        }
        return parsed.value
    },
    async saveSettings(settings) {
        const path = `${await getConfigFolderPath()}/settings.json`
        const json = JSON.stringify(settings, undefined, 2)
        if (!await writeFile(path, json)) {
            void this.error('Failed to save settings', path, json)
        }
    },
    async loadGame() {
        const path = `${await getConfigFolderPath()}/saves.json`
        const json = await readFile(path)
        const parsed = tryParseJson(json ?? '', 'game', parseGameState)
        if (parsed.ctx.warnings.length) void this.warn(parsed.ctx.warnings)
        if (!parsed.success) {
            void this.error('Failed to load game', json, parsed.ctx.errors)
            return gamePlayerStore.getSnapshot()
        }
        return parsed.value
    },
    async saveGame(game) {
        const path = `${await getConfigFolderPath()}/saves.json`
        const json = JSON.stringify(game, undefined, 2)
        if (!await writeFile(path, json)) {
            void this.error('Failed to save game', path, json)
        }
    },
    async setTitle(title) {
        await setTitle(title)
    },
    async readFromClipboard() {
        const format = await nClipboard.getFormat()
        if (format !== nClipboard.ClipboardFormat.text) return null
        const text = await nClipboard.readText()
        if (!text) return null
        return text
    },
    async writeToClipboard(text) {
        await nClipboard.writeText(text)
    },
    async log(...objs) {
        console.log(...objs)
        await nDebug.log(objs.map(o => JSON.stringify(o)).join(' '), 'INFO' as LoggerType)
    },
    async warn(...objs) {
        console.warn(...objs)
        await nDebug.log(objs.map(o => JSON.stringify(o)).join(' '), 'WARNING' as LoggerType)
    },
    async error(...objs) {
        console.error(...objs)
        await nDebug.log(objs.map(o => JSON.stringify(o)).join(' '), 'ERROR' as LoggerType)
    },
}
