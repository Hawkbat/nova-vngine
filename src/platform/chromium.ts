import { createProject } from '../store/project'
import { parseViewState } from '../types/viewstate'
import { viewStateStore } from '../store/viewstate'
import { randID, randSeedRandom } from '../utils/rand'
import type { Branded } from '../utils/types'
import { get, set, entries, createStore } from 'idb-keyval'
import type { Platform, PlatformFilesystemEntry } from '../types/platform'
import { PlatformError, DEFAULT_PROJECT_FILENAME } from '../types/platform'
import { tryParseJson } from '../utils/guard'
import { parseProjectDefinition } from '../types/definitions'
import { wait } from '../utils/async'

const idbStore = createStore('chromium-handle-db', 'chromium-handle-store')

type ChromiumHandleKey = Branded<string, 'ChromiumHandleKey'>
type HandleValue = FileSystemFileHandle | FileSystemDirectoryHandle

async function storeChromiumHandle(handle: HandleValue) {
    for (const [k, v] of await entries<ChromiumHandleKey, HandleValue>(idbStore)) {
        if (await v.isSameEntry(handle)) {
            return k
        }
    }
    const key = randID(randSeedRandom())[1]
    await set(key, handle, idbStore)
    return key as ChromiumHandleKey
}

async function storeChromiumFileHandle(handle: FileSystemFileHandle): Promise<ChromiumHandleKey> {
    return await storeChromiumHandle(handle)
}

async function storeChromiumDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<ChromiumHandleKey> {
    return await storeChromiumHandle(handle)
}

async function retrieveChromiumFileHandle(key: ChromiumHandleKey): Promise<FileSystemFileHandle | null> {
    const handle = await get<HandleValue>(key, idbStore)
    if (!handle || !(handle instanceof FileSystemFileHandle)) return null
    return handle
}

async function retrieveChromiumDirectoryHandle(key: ChromiumHandleKey): Promise<FileSystemDirectoryHandle | null> {
    const handle = await get<HandleValue>(key, idbStore)
    if (!handle || !(handle instanceof FileSystemDirectoryHandle)) return null
    return handle
}

export const chromiumPlatform: Platform = {
    name: 'Browser (Chromium)',
    async initialize() {

    },
    async loadViewState() {
        const json = localStorage.getItem('nvn-viewstate')
        const parsed = tryParseJson(json ?? '', 'viewState', parseViewState)
        if (parsed.ctx.warnings.length) void this.warn(parsed.ctx.warnings)
        if (!parsed.success) {
            void this.error('Failed to parse viewstate', json, parsed.ctx.errors)
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
        const key = dir.handle as ChromiumHandleKey
        const dirHandle = await retrieveChromiumDirectoryHandle(key)
        if (!dirHandle) throw new PlatformError('bad-project', 'Could not get access to the project folder. It may have been changed, moved, or deleted.')
        const name = DEFAULT_PROJECT_FILENAME
        const handle = await dirHandle.getFileHandle(name)
        const json = await (await handle.getFile()).text()
        const parsed = tryParseJson(json, 'project', parseProjectDefinition)
        if (parsed.ctx.warnings.length) void this.warn(parsed.ctx.warnings)
        if (!parsed.success) {
            void this.error('Failed to parse project', json, parsed.ctx.errors)
            throw new PlatformError('bad-project', 'The project file was outdated or corrupted in a manner that has prevented it from loading.')
        }
        return parsed.value
    },
    async saveProject(dir, project) {
        const key = dir.handle as ChromiumHandleKey
        const dirHandle = await retrieveChromiumDirectoryHandle(key)
        if (!dirHandle) throw new PlatformError('bad-project', 'Could not get access to the project folder. It may have been changed, moved, or deleted.')
        const name = DEFAULT_PROJECT_FILENAME
        const handle = await dirHandle.getFileHandle(name, { create: true })
        const stream = await handle.createWritable()
        await stream.write(JSON.stringify(project, undefined, 2))
        await stream.close()
    },
    async createProject(dir) {
        const key = dir.handle as ChromiumHandleKey
        const dirHandle = await retrieveChromiumDirectoryHandle(key)
        if (!dirHandle) throw new PlatformError('bad-project', 'Could not get access to the project folder. Unable to create project.')
        const project = createProject()
        await this.saveProject(dir, project)
        return project
    },
    async setTitle(title) {
        document.title = title
        await wait(0)
    },
    async pickFiles(title, fileType, extensions, multi) {
        try {
            const results = await window.showOpenFilePicker({ id: 'nvn', types: [{ description: fileType, accept: { 'application/octet-stream': extensions.map(e => e.startsWith('.') ? e : `.${e}`) as `.${string}`[] } }], multiple: multi })
            if (!results.length) return null
            return await Promise.all(results.map(async r => ({
                path: r.name,
                name: r.name,
                handle: await storeChromiumFileHandle(r),
            })))
        } catch (err) {
            if (typeof err === 'object' && err && 'name' in err && err.name === 'AbortError') {
                return null
            }
            throw err
        }
    },
    async pickDirectory(title) {
        try {
            const result = await window.showDirectoryPicker({ id: 'nvn', mode: 'readwrite' })
            const key = await storeChromiumDirectoryHandle(result)
            const directory: PlatformFilesystemEntry = {
                path: result.name,
                name: result.name,
                handle: key,
            }

            const files: PlatformFilesystemEntry[] = (await Array.fromAsync(result.values())).filter(t => t.kind === 'file').map(t => ({ type: 'file', name: t.name, path: `${result.name}/${t.name}`, handle: '' }))
            const directories: PlatformFilesystemEntry[] = (await Array.fromAsync(result.values())).filter(t => t.kind === 'directory').map(t => ({ type: 'directory', path: `${result.name}/${t.name}`, name: t.name, files: [], directories: [], handle: '' }))
            return {
                directory,
                files,
                directories,
            }
        } catch (err) {
            if (typeof err === 'object' && err && 'name' in err && err.name === 'AbortError') {
                return null
            }
            throw err
        }
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
