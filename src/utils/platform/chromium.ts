import { createProject } from "../../store/project"
import type { ViewState } from "../../store/viewstate"
import { viewStateStore } from "../../store/viewstate"
import { randID, randSeedRandom } from "../rand"
import type { Branded } from "../types"
import { get, set, entries, createStore } from 'idb-keyval'
import type { Platform, PlatformFilesystemEntry } from "./common"
import { PlatformError, DEFAULT_PROJECT_FILENAME } from "./common"

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
        if (!json) return viewStateStore.getSnapshot()
        const viewState = JSON.parse(json) as ViewState
        return viewState
    },
    async saveViewState(viewState) {
        localStorage.setItem('nvn-viewstate', JSON.stringify(viewState))
    },
    async loadProject(dir) {
        const key = dir.handle as ChromiumHandleKey
        const dirHandle = await retrieveChromiumDirectoryHandle(key)
        if (!dirHandle) throw new PlatformError('bad-project', `Could not get access to the project folder. It may have been changed, moved, or deleted.`)
        const name = DEFAULT_PROJECT_FILENAME
        const handle = await dirHandle.getFileHandle(name)
        const json = await (await handle.getFile()).text()
        const project = JSON.parse(json)
        return project
    },
    async saveProject(dir, project) {
        const key = dir.handle as ChromiumHandleKey
        const dirHandle = await retrieveChromiumDirectoryHandle(key)
        if (!dirHandle) throw new PlatformError('bad-project', `Could not get access to the project folder. It may have been changed, moved, or deleted.`)
        const name = DEFAULT_PROJECT_FILENAME
        const handle = await dirHandle.getFileHandle(name, { create: true })
        const stream = await handle.createWritable()
        await stream.write(JSON.stringify(project, undefined, 2))
        await stream.close()
    },
    async createProject(dir) {
        const key = dir.handle as ChromiumHandleKey
        const dirHandle = await retrieveChromiumDirectoryHandle(key)
        if (!dirHandle) throw new PlatformError('bad-project', `Could not get access to the project folder. Unable to create project.`)
        const project = createProject()
        await this.saveProject(dir, project)
        return project
    },
    async setTitle(title) {
        document.title = title
    },
    async pickFiles(title, fileType, extensions, multi) {
        try {
            const results = await window.showOpenFilePicker({ id: 'nvn', types: [{ description: fileType, accept: { 'application/octet-stream': extensions.map(e => e.startsWith('.') ? e : `.${e}`) as `.${string}`[] } }], multiple: multi })
            if (!results.length) return null
            return Promise.all(results.map(async r => ({
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

            const files: PlatformFilesystemEntry[] = (await Array.fromAsync(result.values())).filter(t => t.kind === 'file').map(t => ({ type: 'file', name: t.name, path: `${result.name}/${t.name}`, handle: null }))
            const directories: PlatformFilesystemEntry[] = (await Array.fromAsync(result.values())).filter(t => t.kind === 'directory').map(t => ({ type: 'directory', path: `${result.name}/${t.name}`, name: t.name, files: [], directories: [], handle: null }))
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
}
