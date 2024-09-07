import type { StorageFileResult, StorageProvider, StorageRootEntry } from '../types/storage'
import { joinPathSegments } from '../utils/path'
import { uncheckedRandID } from '../utils/rand'
import { browserStorageProvider, getHandlePath, getRootKeyFromPath, getRootPath, retrieveDirectoryHandle, searchForHandleKey, storeDirectoryHandle } from './browser'

export const chromiumStorageProvider: StorageProvider = {
    type: 'chromium',
    name: 'Local Drive (Sandboxed)',
    isSupported() {
        return 'showOpenFilePicker' in window
    },
    async loadText(root, path) {
        return await browserStorageProvider.loadText(root, path)
    },
    async loadBinary(root, path) {
        return await browserStorageProvider.loadBinary(root, path)
    },
    async loadAsset(root, path) {
        return await browserStorageProvider.loadAsset(root, path)
    },
    async loadAssetThumbnail(root, asset) {
        return await browserStorageProvider.loadAssetThumbnail(root, asset)
    },
    async storeText(root, path, text) {
        return await browserStorageProvider.storeText?.(root, path, text)
    },
    async storeBinary(root, path, buffer) {
        return await browserStorageProvider.storeBinary?.(root, path, buffer)
    },
    async listDirectory(root, path) {
        return await browserStorageProvider.listDirectory(root, path)
    },
    async pickFiles(root, { title, fileType, extensions, multi, startIn: startPath }) {
        try {
            const rootHandle = root ? await retrieveDirectoryHandle(getRootPath(root)) : null
            const startIn = root && startPath ? await retrieveDirectoryHandle(getHandlePath(root, startPath)) ?? undefined : undefined

            const results = await window.showOpenFilePicker({ id: 'nvn', types: [{ description: fileType, accept: { 'application/octet-stream': extensions.map(e => e.startsWith('.') ? e : `.${e}`) as `.${string}`[] } }], multiple: multi, startIn })
            if (!results.length) return null
            const files: StorageFileResult[] = await Promise.all(results.map<Promise<StorageFileResult>>(async r => {
                const segments = await rootHandle?.resolve(r)
                const path = segments ? joinPathSegments(segments) : r.name
                return {
                    type: 'file',
                    name: r.name,
                    path,
                    async text() {
                        return await chromiumStorageProvider.loadText(root, path)
                    },
                    async binary() {
                        return await chromiumStorageProvider.loadBinary(root, path)
                    },
                }
            }))
            return files
        } catch (err) {
            if (typeof err === 'object' && err && 'name' in err && err.name === 'AbortError') {
                return null
            }
            throw err
        }
    },
    async pickDirectory(root, { title, startIn: startPath }) {
        try {
            const rootHandle = root ? await retrieveDirectoryHandle(getRootPath(root)) : null
            const startIn = root && startPath ? await retrieveDirectoryHandle(getHandlePath(root, startPath)) ?? undefined : undefined

            const result = await window.showDirectoryPicker({ id: 'nvn', mode: 'readwrite', startIn })
            const segments = await rootHandle?.resolve(result)
            const path = segments ? joinPathSegments(segments) : result.name

            return {
                type: 'directory',
                name: result.name,
                path,
                async entries() {
                    return await chromiumStorageProvider.listDirectory(root, path)
                },
                async toRoot() {
                    const existingKey = await searchForHandleKey(result)
                    const key = existingKey ? getRootKeyFromPath(existingKey) : uncheckedRandID()
                    const root: StorageRootEntry = { type: 'chromium', key }
                    await storeDirectoryHandle(getRootPath(root), result)
                    return root
                },
            }
        } catch (err) {
            if (typeof err === 'object' && err && 'name' in err && err.name === 'AbortError') {
                return null
            }
            throw err
        }
    },
}
