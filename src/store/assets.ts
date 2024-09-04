import { useEffect } from 'react'

import type { AssetDefinition } from '../types/project'
import { createSimpleStore, type SimpleStore, useStore } from '../utils/store'
import { getProjectStorage } from './operations'

interface AssetCacheEntry {
    count: number
    time: number
    store: SimpleStore<string | null>
    promise: Promise<string> | null
    unload: (() => void) | null
}

const cache: Map<string, AssetCacheEntry> = new Map()

function getCacheEntry(asset: AssetDefinition | null, thumbnail: boolean) {
    const key = `${asset?.path ?? ''}${thumbnail ? '_THUMB' : ''}`
    const existing = cache.get(key)
    if (existing) return existing
    const entry: AssetCacheEntry = {
        count: 0,
        time: Date.now(),
        store: createSimpleStore<string | null>(null),
        promise: null,
        unload: null,
    }
    cache.set(key, entry)
    return entry
}

function incrementRefCount(asset: AssetDefinition | null, thumbnail: boolean) {
    const entry = getCacheEntry(asset, thumbnail)
    entry.count++
    entry.time = Date.now()
    if (entry.count >= 1 && entry.promise === null && asset) {
        entry.promise = (async () => {
            const { root, storage } = getProjectStorage()
            const { url, unload } = thumbnail ? await storage.loadAssetThumbnail(root, asset) : await storage.loadAsset(root, asset)
            entry.unload = unload
            entry.store.setValue(() => url)
            return url
        })()
    }
}

function decrementRefCount(asset: AssetDefinition | null, thumbnail: boolean) {
    const entry = getCacheEntry(asset, thumbnail)
    entry.count--
    entry.time = Date.now()
    if (entry.count <= 0 && entry.promise !== null) {
        entry.promise = null
        entry.unload?.()
        entry.unload = null
        entry.store.setValue(() => null)
    }
}

export function useAsset(asset: AssetDefinition | null, thumbnail: boolean) {
    const entry = getCacheEntry(asset, thumbnail)
    const [getURL] = useStore(entry.store)
    useEffect(() => {
        incrementRefCount(asset, thumbnail)
        return () => {
            decrementRefCount(asset, thumbnail)
        }
    }, [asset, thumbnail])
    return asset ? getURL : () => null
}
