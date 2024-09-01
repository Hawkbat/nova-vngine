import { filesystem as nFS, os as nOS } from '@neutralinojs/lib'

import { LOG_FILE_WRITES } from '../../debug'
import { type StorageDirectoryResult, StorageError, type StorageFileResult, type StorageProvider } from '../../types/storage'
import { getAbsolutePath, getPathFileName, getRelativePath } from '../../utils/path'
import { ensureParentDirectories, isNeutralinoError, neutralinoPlatform, waitForNeutralinoInit } from '../neutralino'

export const neutralinoStorageProvider: StorageProvider = {
    type: 'neutralino',
    name: 'Native Filesystem',
    isSupported() {
        return 'NL_APPID' in window
    },
    async loadText(root, path) {
        await waitForNeutralinoInit()
        path = root ? getAbsolutePath(path, root.key) : path
        try {
            return await nFS.readFile(path)
        } catch (err) {
            if (isNeutralinoError(err) && err.code === 'NE_FS_FILRDER') throw new StorageError('not-found', 'File does not exist or is not accessible.')
            throw err
        }
    },
    async loadBinary(root, path) {
        await waitForNeutralinoInit()
        path = root ? getAbsolutePath(path, root.key) : path
        try {
            return await nFS.readBinaryFile(path)
        } catch (err) {
            if (isNeutralinoError(err) && err.code === 'NE_FS_FILRDER') throw new StorageError('not-found', 'File does not exist or is not accessible.')
            throw err
        }
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
    async storeText(root, path, text) {
        await waitForNeutralinoInit()
        path = root ? getAbsolutePath(path, root.key) : path
        await ensureParentDirectories(path)
        if (LOG_FILE_WRITES) {
            void neutralinoPlatform.log('Writing file', path)
        }
        try {
            await nFS.writeFile(path, text)
        } catch (err) {
            if (isNeutralinoError(err) && err.code === 'NE_FS_FILWRER') throw new StorageError('not-found', 'File is not writable.')
            throw err
        }
    },
    async storeBinary(root, path, buffer) {
        await waitForNeutralinoInit()
        path = root ? getAbsolutePath(path, root.key) : path
        await ensureParentDirectories(path)
        if (LOG_FILE_WRITES) {
            void neutralinoPlatform.log('Writing file', path)
        }
        try {
            await nFS.writeBinaryFile(path, buffer)
        } catch (err) {
            if (isNeutralinoError(err) && err.code === 'NE_FS_FILWRER') throw new StorageError('not-found', 'File is not writable.')
            throw err
        }
    },
    async listDirectory(root, path) {
        await waitForNeutralinoInit()
        path = root ? getAbsolutePath(path, root.key) : path
        try {
            const entries = await nFS.readDirectory(path)
            const files: StorageFileResult[] = entries.filter(e => e.type === 'FILE').map(e => ({
                type: 'file',
                name: e.entry,
                path: root ? getRelativePath(e.path, root.key) : e.path,
                async text() {
                    return await neutralinoStorageProvider.loadText(root, root ? getRelativePath(e.path, root.key) : e.path)
                },
                async binary() {
                    return await neutralinoStorageProvider.loadBinary(root, root ? getRelativePath(e.path, root.key) : e.path)
                },
            }))
            const directories: StorageDirectoryResult[] = entries.filter(e => e.type === 'DIRECTORY').map(e => ({
                type: 'directory',
                name: e.entry,
                path: root ? getRelativePath(e.path, root.key) : e.path,
                async entries() {
                    return await neutralinoStorageProvider.listDirectory(root, root ? getRelativePath(e.path, root.key) : e.path)
                },
                async toRoot() {
                    return { type: 'neutralino', key: e.path }
                },
            }))
            return { files, directories }
        } catch (err) {
            if (isNeutralinoError(err) && err.code === 'NE_FS_NOPATHE') throw new StorageError('not-found', 'Directory does not exist or is not accessible.')
            throw err
        }
    },
    async pickFiles(root, { title, fileType, extensions, multi, startIn }) {
        await waitForNeutralinoInit()
        try {
            const path = root ? startIn ? getAbsolutePath(startIn, root.key) : root.key : await nOS.getPath('documents')
            const filePaths = await nOS.showOpenDialog(title, { defaultPath: path, filters: [{ name: fileType, extensions }, { name: 'All files', extensions: ['*'] }], multiSelections: multi })
            if (!filePaths.length) return null
            return filePaths.map(p => ({
                type: 'file',
                name: getPathFileName(p),
                path: root ? getRelativePath(p, root.key) : p,
                async text() {
                    return await neutralinoStorageProvider.loadText(root, root ? getRelativePath(p, root.key) : p)
                },
                async binary() {
                    return await neutralinoStorageProvider.loadBinary(root, root ? getRelativePath(p, root.key) : p)
                },
            }))
        } catch (err) {
            if (isNeutralinoError(err) && err.code === 'NE_FS_NOPATHE') return null
            throw err
        }
    },
    async pickDirectory(root, { title, startIn }) {
        await waitForNeutralinoInit()
        try {
            const path = root ? startIn ? getAbsolutePath(startIn, root.key) : root.key : await nOS.getPath('documents')
            const dirPath = await nOS.showFolderDialog(title, { defaultPath: path })
            if (!dirPath) return null
            return {
                type: 'directory',
                name: getPathFileName(dirPath),
                path: root ? getRelativePath(dirPath, root.key) : dirPath,
                async entries() {
                    return await neutralinoStorageProvider.listDirectory(root, root ? getRelativePath(dirPath, root.key) : dirPath)
                },
                async toRoot() {
                    return { type: 'neutralino', key: dirPath }
                },
            }
        } catch (err) {
            if (isNeutralinoError(err) && err.code === 'NE_FS_NOPATHE') return null
            throw err
        }
    },
}
