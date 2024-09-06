import { STORAGE_FORCE } from '../debug'
import { browserStorageProvider } from './browser'
import { chromiumStorageProvider } from './chromium'
import { fetchStorageProvider } from './fetch'
import { neutralinoStorageProvider } from './neutralino'

export const storage = {
    neutralino: neutralinoStorageProvider,
    chromium: chromiumStorageProvider,
    browser: browserStorageProvider,
    fetch: fetchStorageProvider,
}

export type StorageType = keyof typeof storage

export function getStorageProvider(preferred: StorageType | undefined = STORAGE_FORCE) {
    if (preferred && storage[preferred].isSupported()) return storage[preferred]
    if (neutralinoStorageProvider.isSupported()) return neutralinoStorageProvider
    if (chromiumStorageProvider.isSupported()) return chromiumStorageProvider
    if (browserStorageProvider.isSupported()) return browserStorageProvider
    return fetchStorageProvider
}
