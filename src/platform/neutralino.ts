import type { KnownPath } from '@neutralinojs/lib'
import { init, events as nEvents, app as nApp, filesystem as nFS, os as nOS, window as nWindow } from '@neutralinojs/lib'
import faviconUrl from '../favicon.png'
import { awaitAllMap, createExposedPromise } from '../utils/async'
import { LOG_FILE_WRITES } from '../debug'
import { createProject } from "../store/project"
import { parseViewState } from '../types/viewstate'
import { viewStateStore } from '../store/viewstate'
import { parseProjectDefinition } from '../types/definitions'
import type { Platform, PlatformFilesystemEntry } from '../types/platform'
import { DEFAULT_PROJECT_FILENAME, PlatformError } from '../types/platform'
import { tryParseJson } from '../utils/guard'

const APP_DIR_NAME = '/Nova VNgine'

const initPromise = createExposedPromise<void>()
let initialized = false

interface NativeError {
    code: string
    message: string
}

function isNeutralinoError(err: unknown): err is NativeError {
    return !!err && typeof err === 'object' && 'code' in err && typeof err.code === 'string' && 'message' in err && typeof err.message === 'string'
}

async function setTitle(title: string) {
    document.title = title
    if (!initialized) await initPromise.promise
    await nWindow.setTitle(title)
}

async function pickFiles({ title, filterName, extensions, multiSelections, defaultPath }: { title: string, filterName: string, extensions: string[], multiSelections?: boolean, defaultPath?: string }) {
    if (!initialized) await initPromise.promise
    try {
        const paths = await nOS.showOpenDialog(title, { defaultPath: defaultPath ?? await nOS.getPath('documents'), filters: [{ name: filterName, extensions }, { name: 'All files', extensions: ['*'] }], multiSelections })
        const entries = (await Promise.all(paths.map(p => nFS.getPathParts(p)))).map(p => ({ entry: p.filename, path: `${p.parentPath}/${p.filename}`, type: 'FILE' }))
        return { paths, entries }
    } catch (err) {
        if (isNeutralinoError(err) && err.code === 'NE_FS_NOPATHE') return null
        throw err
    }
}

async function pickDirectory({ title, defaultPath }: { title: string, defaultPath?: string }) {
    if (!initialized) await initPromise.promise
    try {
        const path = await nOS.showFolderDialog(title, { defaultPath: defaultPath ?? await nOS.getPath('documents') })
        const entries = (await nFS.readDirectory(path)) as { entry: string, path: string, type: 'FILE' | 'DIRECTORY' }[]
        return { path, entries }
    } catch (err) {
        if (isNeutralinoError(err) && err.code === 'NE_FS_NOPATHE') return null
        throw err
    }
}

async function readFile(path: string): Promise<string | null> {
    if (!initialized) await initPromise.promise
    try {
        return await nFS.readFile(path)
    } catch (err) {
        if (isNeutralinoError(err) && err.code === 'NE_FS_FILRDER') return null
        throw err
    }
}

async function writeFile(path: string, data: string): Promise<void> {
    if (!initialized) await initPromise.promise
    const pathInfo = await nFS.getPathParts(path)
    try {
        const parentStats = await nFS.getStats(pathInfo.parentPath)
        if (!parentStats.isDirectory) throw new Error(`Parent path is a file, not a directory`)
    } catch (err) {
        if (isNeutralinoError(err) && err.code === 'NE_FS_NOPATHE') {
            await nFS.createDirectory(pathInfo.parentPath)
        } else {
            throw err
        }
    }
    if (LOG_FILE_WRITES) {
        console.log('Writing file', path)
    }
    await nFS.writeFile(path, data)
}

async function readJsonFile<T>(path: string): Promise<T | null> {
    const text = await readFile(path)
    if (!text) return null
    return JSON.parse(text) as T
}

async function writeJsonFile<T>(path: string, data: T) {
    await writeFile(path, JSON.stringify(data, undefined, 2))
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
    return `${await getSafePath('config') ?? await getSafePath('documents')}${APP_DIR_NAME}`
}

async function getStandardPaths() {
    if (!initialized) await initPromise.promise
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
    if (!initialized) await initPromise.promise
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
    if (!initialized) await initPromise.promise
    await nApp.exit()
}

export const neutralinoPlatform: Platform = {
    name: 'Desktop (Neutralino)',
    async initialize() {

        init()

        await nEvents.on('windowClose', async (e: CustomEvent<null>) => {
            await nApp.exit()
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
            { id: 'exit', text: 'Exit', onClick: () => exitApplication() },
        ])

        initialized = true
        initPromise.resolve()
    },
    async loadViewState() {
        const path = `${await getConfigFolderPath()}/viewstate.json`
        const json = await readFile(path)
        const parsed = tryParseJson(json ?? '', 'project', parseViewState)
        if (parsed.ctx.warnings.length) console.warn(parsed.ctx.warnings)
        if (!parsed.success) {
            console.error(parsed.ctx.errors)
            return viewStateStore.getSnapshot()
        }
        return parsed.value
    },
    async saveViewState(viewState) {
        const path = `${await getConfigFolderPath()}/viewstate.json`
        await writeJsonFile(path, viewState)
    },
    async loadProject(dir) {
        const path = `${dir.handle}/${DEFAULT_PROJECT_FILENAME}`
        const json = await readFile(path)
        const parsed = tryParseJson(json ?? '', 'project', parseProjectDefinition)
        if (parsed.ctx.warnings.length) console.warn(parsed.ctx.warnings)
        if (!parsed.success) {
            console.error(parsed.ctx.errors)
            throw new PlatformError('bad-project', `The project file was outdated or corrupted in a manner that has prevented it from loading.`)
        }
        return parsed.value
    },
    async saveProject(dir, project) {
        await writeJsonFile(`${dir.handle}/${DEFAULT_PROJECT_FILENAME}`, project)
    },
    async createProject(dir) {
        const project = createProject()
        await this.saveProject(dir, project)
        return project
    },
    async setTitle(title) {
        await setTitle(title)
    },
    async pickFiles(title, fileType, extensions, multi) {
        const entries = await pickFiles({ title, filterName: fileType, extensions, multiSelections: multi })
        if (!entries || !entries.paths.length) return null
        return entries.entries.map(e => ({ type: 'file', name: e.entry, path: e.path, handle: e.path }))
    },
    async pickDirectory(title) {
        const dir = await pickDirectory({ title })
        if (!dir) return null
        const directory: PlatformFilesystemEntry = {
            path: dir.path,
            name: dir.path.substring(dir.path.lastIndexOf('/') + 1),
            handle: dir.path,
        }
        const files: PlatformFilesystemEntry[] = dir.entries.filter(e => e.type === 'FILE').map(e => ({
            path: e.path,
            name: e.entry,
            handle: e.path,
        }))
        const directories: PlatformFilesystemEntry[] = dir.entries.filter(e => e.type === 'DIRECTORY').map(e => ({
            path: e.path,
            name: e.entry,
            handle: e.path,
        }))
        return {
            directory,
            files,
            directories,
        }
    },
}
