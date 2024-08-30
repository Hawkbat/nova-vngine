import type { StorageDirectoryResult, StorageFileResult, StorageProvider } from '../../types/storage'
import { parseStorageDirectoryListing, StorageError } from '../../types/storage'

import { tryParseJson } from '../../utils/guard'
import { getAbsolutePath, getRelativePath, joinPaths } from '../../utils/path'
import { platform } from '../platform'

export const fetchStorageProvider: StorageProvider = {
    type: 'fetch',
    name: 'External Server',
    isSupported() {
        return true
    },
    async loadText(root, path) {
        path = root ? getAbsolutePath(path, root.key) : path
        const res = await fetch(path)
        if (!res.ok) throw new StorageError('not-found', 'File coult not be fetched at the provided URL.')
        const text = await res.text()
        return text
    },
    async loadBinary(root, path) {
        path = root ? getAbsolutePath(path, root.key) : path
        const res = await fetch(path)
        if (!res.ok) throw new StorageError('not-found', 'File coult not be fetched at the provided URL.')
        const buffer = await res.arrayBuffer()
        return buffer
    },
    async loadAsset(root, path) {
        path = root ? getAbsolutePath(path, root.key) : path
        const res = await fetch(path)
        if (!res.ok) throw new StorageError('not-found', 'File coult not be fetched at the provided URL.')
        return {
            url: path,
            unload() { },
        }
    },
    async listDirectory(root, path) {
        path = root ? getAbsolutePath(path, root.key) : path
        const listingPath = joinPaths(path, './index.json')
        const res = await fetch(listingPath)
        if (!res.ok) throw new StorageError('not-found', 'Directory listing could not be fetched as the provided URL.')
        const json = await res.text()
        const parsed = tryParseJson(json, 'listing', parseStorageDirectoryListing)
        if (parsed.ctx.warnings.length) void platform.warn(parsed.ctx.warnings)
        if (!parsed.success) {
            void platform.error('Failed to load directory listing', json, parsed.ctx.errors)
            throw new StorageError('not-found', 'Directory listing at the provided URL could not be loaded.')
        }
        const entries = parsed.value.entries
        return {
            files: entries.filter(e => e.type === 'file').map<StorageFileResult>(e => ({
                type: 'file',
                name: e.name,
                path: e.path,
                async text() {
                    return await fetchStorageProvider.loadText(root, root ? getRelativePath(e.path, root.key) : e.path)
                },
                async binary() {
                    return await fetchStorageProvider.loadBinary(root, root ? getRelativePath(e.path, root.key) : e.path)
                },
            })),
            directories: entries.filter(e => e.type === 'directory').map<StorageDirectoryResult>(e => ({
                type: 'directory',
                name: e.name,
                path: e.path,
                async entries() {
                    return await fetchStorageProvider.listDirectory(root, root ? getRelativePath(e.path, root.key) : e.path)
                },
                async toRoot() {
                    return { type: 'fetch', key: root ? getAbsolutePath(e.path, root.key) : e.path }
                },
            })),
        }
    },
}
