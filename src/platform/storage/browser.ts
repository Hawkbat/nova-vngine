import { createStore, entries, get, set } from 'idb-keyval'

import type { StorageDirectoryResult, StorageFileResult, StorageProvider, StorageRootEntry } from '../../types/storage'
import { StorageError } from '../../types/storage'
import { getClassFilter, throwIfNull } from '../../utils/guard'
import { createThumbnail } from '../../utils/media'
import { getPathFileName, getPathParentPath, getPathSegments, joinPaths, joinPathSegments } from '../../utils/path'
import { uncheckedRandID } from '../../utils/rand'

const idbStore = createStore('fs-handle-db', 'fs-handle-store')

type HandleValue = FileSystemFileHandle | FileSystemDirectoryHandle

export async function searchForHandleKey(handle: HandleValue) {
    for (const [k, v] of await entries<string, HandleValue>(idbStore)) {
        if (await v.isSameEntry(handle)) return k
    }
    return null
}

async function storeHandle(path: string, handle: HandleValue) {
    await set(path, handle, idbStore)
}

async function storeFileHandle(path: string, handle: FileSystemFileHandle): Promise<void> {
    return await storeHandle(path, handle)
}

export async function storeDirectoryHandle(path: string, handle: FileSystemDirectoryHandle): Promise<void> {
    return await storeHandle(path, handle)
}

async function retrieveFileHandle(path: string): Promise<FileSystemFileHandle | null> {
    const handle = await get<HandleValue>(path, idbStore)
    if (!handle || !(handle instanceof FileSystemFileHandle)) return null
    return handle
}

export async function retrieveDirectoryHandle(path: string): Promise<FileSystemDirectoryHandle | null> {
    const handle = await get<HandleValue>(path, idbStore)
    if (!handle || !(handle instanceof FileSystemDirectoryHandle)) return null
    return handle
}

const ROOT_PATH_PREFIX = 'fs://'

export function getRootPath(root: StorageRootEntry) {
    return `${ROOT_PATH_PREFIX}${root.key}`
}

export function getRootKeyFromPath(path: string) {
    if (path.startsWith(ROOT_PATH_PREFIX)) return path.substring(ROOT_PATH_PREFIX.length)
    throw new Error('Path was not a root path')
}

export function getHandlePath(root: StorageRootEntry, path: string) {
    return joinPaths(getRootPath(root), path)
}

async function checkPermissions(handle: HandleValue) {
    let perms = await handle.queryPermission({ mode: 'readwrite' })
    if (perms === 'denied' || perms === 'prompt') {
        perms = await handle.requestPermission({ mode: 'readwrite' })
    }
    return perms
}

async function ensureDirectoryHandle(root: StorageRootEntry, path: string) {
    const segments = getPathSegments(getHandlePath(root, path))
    const rootSegment = throwIfNull(segments.shift())
    let handle = throwIfNull(await retrieveDirectoryHandle(rootSegment))
    await checkPermissions(handle)
    let fullPath = rootSegment
    for (const s of segments) {
        fullPath = joinPaths(fullPath, s)
        handle = await handle.getDirectoryHandle(s, { create: true })
        await storeDirectoryHandle(fullPath, handle)
        await checkPermissions(handle)
    }
    return handle
}

async function ensureFileHandle(root: StorageRootEntry, path: string) {
    const fullPath = getHandlePath(root, path)
    const parentPath = getPathParentPath(fullPath)
    const fileName = getPathFileName(fullPath)
    const dirHandle = await ensureDirectoryHandle(root, parentPath)
    const fileHandle = await dirHandle.getFileHandle(fileName, { create: true })
    await storeFileHandle(fullPath, fileHandle)
    await checkPermissions(fileHandle)
    return fileHandle
}

async function loadFileHandle(root: StorageRootEntry, path: string) {
    const fullPath = getHandlePath(root, path)

    let fileHandle = await retrieveFileHandle(fullPath)
    if (fileHandle) return fileHandle

    const parentPath = getPathParentPath(fullPath)
    const fileName = getPathFileName(fullPath)
    const dirHandle = await ensureDirectoryHandle(root, parentPath)
    fileHandle = await dirHandle.getFileHandle(fileName)
    await storeFileHandle(fullPath, fileHandle)
    await checkPermissions(fileHandle)
    return fileHandle
}

export const browserStorageProvider: StorageProvider = {
    type: 'browser',
    name: 'Private Filesystem',
    isSupported() {
        return true
    },
    async loadText(root, path) {
        if (!root) throw new StorageError('not-supported', 'Loading unscoped files is not supported.')
        const handle = await loadFileHandle(root, path)
        const file = await handle.getFile()
        const text = await file.text()
        return text
    },
    async loadBinary(root, path) {
        if (!root) throw new StorageError('not-supported', 'Loading unscoped files is not supported.')
        const handle = await loadFileHandle(root, path)
        const file = await handle.getFile()
        const buffer = await file.arrayBuffer()
        return buffer
    },
    async loadAsset(root, asset) {
        const buffer = await this.loadBinary(root, asset.path)
        const blob = new Blob([buffer], { type: asset.mimeType })
        const url = URL.createObjectURL(blob)
        const unload = () => {
            URL.revokeObjectURL(url)
        }
        return {
            url,
            unload,
        }
    },
    async loadAssetThumbnail(root, asset) {
        const thumbPath = `${asset.path}_thumb`
        try {
            const buffer = await this.loadBinary(root, thumbPath)
            const blob = new Blob([buffer], { type: 'image/png' })
            const url = URL.createObjectURL(blob)
            const unload = () => {
                URL.revokeObjectURL(url)
            }
            return {
                url,
                unload,
            }
        } catch (e) {
            console.error(e)
            const { url, unload } = await this.loadAsset(root, asset)
            const blob = await createThumbnail(url)
            unload()
            const arrayBuffer = await blob.arrayBuffer()
            await this.storeBinary?.(root, thumbPath, arrayBuffer)
            const thumbUrl = URL.createObjectURL(blob)
            const thumbUnload = () => {
                URL.revokeObjectURL(url)
            }
            return {
                url: thumbUrl,
                unload: thumbUnload,
            }
        }
    },
    async storeText(root, path, text) {
        if (!root) throw new StorageError('not-supported', 'Saving unscoped files is not supported.')
        const handle = await ensureFileHandle(root, path)
        const stream = await handle.createWritable()
        await stream.write(text)
        await stream.close()
    },
    async storeBinary(root, path, buffer) {
        if (!root) throw new StorageError('not-supported', 'Saving unscoped files is not supported.')
        const handle = await ensureFileHandle(root, path)
        const stream = await handle.createWritable()
        await stream.write(buffer)
        await stream.close()
    },
    async listDirectory(root, path) {
        if (!root) throw new StorageError('not-supported', 'Listing files in unscoped directories is not supported.')
        const rootHandle = await retrieveDirectoryHandle(getRootPath(root))
        const dirHandle = await ensureDirectoryHandle(root, path)
        const handles = await Array.fromAsync(dirHandle.values())

        const files: StorageFileResult[] = await Promise.all(handles.filter(getClassFilter(FileSystemFileHandle)).map(async e => {
            const segments = await rootHandle?.resolve(e)
            const path = segments ? joinPathSegments(segments) : e.name
            return {
                type: 'file',
                name: e.name,
                path,
                async text() {
                    return await browserStorageProvider.loadText(root, path)
                },
                async binary() {
                    return await browserStorageProvider.loadBinary(root, path)
                },
            }
        }))

        const directories: StorageDirectoryResult[] = await Promise.all(handles.filter(getClassFilter(FileSystemDirectoryHandle)).map(async e => {
            const segments = await rootHandle?.resolve(e)
            const path = segments ? joinPathSegments(segments) : e.name
            return {
                type: 'directory',
                name: e.name,
                path,
                async entries() {
                    return await browserStorageProvider.listDirectory(root, path)
                },
                async toRoot() {
                    const existingKey = await searchForHandleKey(e)
                    const key = existingKey ?? uncheckedRandID()
                    return { type: 'browser', key }
                },
            }
        }))

        return {
            files,
            directories,
        }
    },
}
