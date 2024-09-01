import { useEffect } from 'react'
import { createSimpleStore, useStore, type SimpleStore } from '../utils/store'
import { getProjectStorage } from './operations'
import type { AssetDefinition } from '../types/project'

interface AssetCacheEntry {
    count: number
    time: number
    store: SimpleStore<string | null>
    promise: Promise<string> | null
    unload: (() => void) | null
}

const cache: Map<string, AssetCacheEntry> = new Map()

function getCacheEntry(asset: AssetDefinition | null) {
    const existing = cache.get(asset?.path ?? '')
    if (existing) return existing
    const entry: AssetCacheEntry = {
        count: 0,
        time: Date.now(),
        store: createSimpleStore<string | null>(null),
        promise: null,
        unload: null,
    }
    cache.set(asset?.path ?? '', entry)
    return entry
}

function incrementRefCount(asset: AssetDefinition | null) {
    const entry = getCacheEntry(asset)
    entry.count++
    entry.time = Date.now()
    if (entry.count >= 1 && entry.promise === null && asset) {
        entry.promise = (async () => {
            const { root, storage } = getProjectStorage()
            const { url, unload } = await storage.loadAsset(root, asset)
            entry.unload = unload
            entry.store.setValue(() => url)
            return url
        })()
    }
}

function decrementRefCount(asset: AssetDefinition | null) {
    const entry = getCacheEntry(asset)
    entry.count--
    entry.time = Date.now()
    if (entry.count <= 0 && entry.promise !== null) {
        entry.promise = null
        entry.unload?.()
        entry.unload = null
        entry.store.setValue(() => null)
    }
}

export function useAsset(asset: AssetDefinition | null) {
    const entry = getCacheEntry(asset)
    const [getURL] = useStore(entry.store)
    useEffect(() => {
        incrementRefCount(asset)
        return () => {
            decrementRefCount(asset)
        }
    }, [asset])
    return asset ? getURL : () => null
}
