import type { StorageType } from '../platform/storage/storage'
import type { ParseFunc } from '../utils/guard'
import { defineParser, parsers as $ } from '../utils/guard'
import type { AssetDefinition } from './project'

export interface StorageRootEntry {
    type: StorageType
    key: string
}

export interface StorageDirectoryResult {
    type: 'directory'
    name: string
    path: string
    entries(): Promise<{ directories: StorageDirectoryResult[], files: StorageFileResult[] }>
    toRoot(): Promise<StorageRootEntry>
}

export interface StorageFileResult {
    type: 'file'
    name: string
    path: string
    text(): Promise<string>
    binary(): Promise<ArrayBuffer>
}

export interface StorageDirectoryListing {
    entries: {
        type: 'directory' | 'file'
        name: string
        path: string
    }[]
}

export interface StorageProvider {
    type: StorageType
    name: string
    isSupported(): boolean
    storeText?(root: StorageRootEntry | null, path: string, text: string): Promise<void>
    storeBinary?(root: StorageRootEntry | null, path: string, buffer: ArrayBuffer): Promise<void>
    loadText(root: StorageRootEntry | null, path: string): Promise<string>
    loadBinary(root: StorageRootEntry | null, path: string): Promise<ArrayBuffer>
    loadAsset(root: StorageRootEntry | null, asset: AssetDefinition): Promise<{ url: string, unload: () => void }>
    loadAssetThumbnail(root: StorageRootEntry | null, asset: AssetDefinition): Promise<{ url: string, unload: () => void }>
    listDirectory(root: StorageRootEntry | null, path: string): Promise<{ directories: StorageDirectoryResult[], files: StorageFileResult[] }>
    pickFiles?(root: StorageRootEntry | null, options: { title?: string, fileType: string, extensions: string[], multi?: boolean, startIn?: string }): Promise<StorageFileResult[] | null>
    pickDirectory?(root: StorageRootEntry | null, options: { title?: string, startIn?: string }): Promise<StorageDirectoryResult | null>
}

export type StorageErrorCode = 'not-found' | 'not-supported'

export class StorageError extends Error {
    readonly code: StorageErrorCode
    override readonly message: string

    constructor(code: StorageErrorCode, message: string) {
        super(message)
        this.code = code
        this.message = message
        this.name = this.constructor.name
    }
}

export function isStorageErrorCode(err: unknown, code: StorageErrorCode): err is StorageError {
    return err instanceof StorageError && err.code === code
}

export const parseStorageRootEntry: ParseFunc<StorageRootEntry> = defineParser<StorageRootEntry>((c, v, d) => $.object(c, v, {
    type: (c, v, d) => $.enum(c, v, ['neutralino', 'chromium', 'browser', 'fetch'], d),
    key: $.string,
}, d))

export const parseStorageDirectoryListing: ParseFunc<StorageDirectoryListing> = defineParser<StorageDirectoryListing>((c, v, d) => $.object(c, v, {
    entries: (c, v, d) => $.array(c, v, (c, v, d) => $.object(c, v, {
        type: (c, v, d) => $.enum(c, v, ['file', 'directory'], d),
        name: $.string,
        path: $.string,
    }, d), d),
}, d))
