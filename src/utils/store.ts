import { useCallback, useSyncExternalStore } from 'react'

import { LOG_STORE_DIFFS } from '../debug'
import { arrayHead } from './array'
import { throwIfNull } from './guard'
import { useLatest } from './hooks'
import { deepDiff, immSet } from './imm'
import { hintTuple } from './types'

export type StoreValueGetter<T> = () => T
export type StoreValueSetter<T> = (oldValue: T) => T

export function createSimpleStore<T>(defaultValue: T) {
    const immediateListeners = new Set<() => void>()
    const deferredListeners = new Set<() => void>()
    let value = defaultValue
    let disposed = false
    let notifyTimeout: number | undefined = undefined

    const subscribeImmediate = (listener: () => void) => {
        if (!disposed) {
            immediateListeners.add(listener)
        }
        return () => {
            if (disposed) return
            immediateListeners.delete(listener)
        }
    }
    const subscribeDeferred = (listener: () => void) => {
        if (!disposed) {
            deferredListeners.add(listener)
        }
        return () => {
            if (disposed) return
            deferredListeners.delete(listener)
        }
    }
    const notify = () => {
        immediateListeners.forEach(l => l())
        clearTimeout(notifyTimeout)
        notifyTimeout = setTimeout(() => {
            deferredListeners.forEach(l => l())
        }, 0)
    }
    const getSnapshot = () => value
    const getValue = () => value
    const setValue = (setter: StoreValueSetter<T>) => {
        if (disposed) {
            console.warn('setValue called on disposed store', value)
            return
        }
        const newValue = setter(value)
        if (newValue !== value) {
            if (LOG_STORE_DIFFS) {
                console.log(deepDiff(value, newValue, 'value'))
            }
            value = newValue
            notify()
        }
    }
    const dispose = () => {
        if (disposed) return
        disposed = true
        immediateListeners.clear()
    }
    const isDisposed = () => disposed

    return {
        subscribeImmediate,
        subscribeDeferred,
        notify,
        getSnapshot,
        getValue,
        setValue,
        isDisposed,
        dispose,
    }
}

export type SimpleStore<T> = ReturnType<typeof createSimpleStore<T>>

export interface StoreMetaState<T> {
    dirty: boolean
    undos: T[]
    redos: T[]
}

export function createTrackedStore<T>(defaultValue: T) {
    const store = createSimpleStore(defaultValue)

    const metaStore = createSimpleStore<StoreMetaState<T>>({
        dirty: false,
        undos: [],
        redos: [],
    })

    const isDirty = () => metaStore.getSnapshot().dirty
    const setDirty = (value: boolean) => metaStore.setValue(s => immSet(s, 'dirty', value))

    const getUndoHistory = () => metaStore.getSnapshot().undos
    const undo = () => {
        const s = metaStore.getSnapshot()
        if (s.undos.length) {
            const currentValue = store.getSnapshot()
            const newValue = throwIfNull(arrayHead(s.undos))
            metaStore.setValue(s => ({
                ...s,
                dirty: true,
                undos: s.undos.slice(1),
                redos: [currentValue, ...s.redos],
            }))
            store.setValue(() => newValue)
        }
    }

    const getRedoHistory = () => metaStore.getSnapshot().undos
    const redo = () => {
        const s = metaStore.getSnapshot()
        if (s.redos.length) {
            const currentValue = store.getSnapshot()
            const newValue = throwIfNull(arrayHead(s.redos))
            metaStore.setValue(s => ({
                ...s,
                dirty: true,
                undos: [currentValue, ...s.undos],
                redos: s.redos.slice(1),
            }))
            store.setValue(() => newValue)
        }
    }

    const clearHistory = () => {
        metaStore.setValue(s => ({
            ...s,
            undos: [],
            redos: [],
        }))
    }

    const setValue = (setter: StoreValueSetter<T>) => {
        const currentValue = store.getSnapshot()
        const newValue = setter(currentValue)
        if (newValue !== currentValue) {
            metaStore.setValue(s => ({
                dirty: true,
                undos: [currentValue, ...s.undos],
                redos: [],
            }))
            store.setValue(() => newValue)
        }
    }

    const augmentedStore = {
        ...store,
        meta: metaStore,
        setValue,
        isDirty,
        setDirty,
        getUndoHistory,
        undo,
        getRedoHistory,
        redo,
        clearHistory,
    }

    return augmentedStore
}

export type TrackedStore<T> = ReturnType<typeof createTrackedStore<T>>

export function useStore<T>(store: SimpleStore<T>, immediate: boolean = false) {
    useSyncExternalStore(immediate ? store.subscribeImmediate : store.subscribeDeferred, store.getSnapshot)
    return hintTuple(store.getValue, store.setValue)
}

export function useMetaStore<T>(store: TrackedStore<T>, immediate: boolean = false) {
    useSyncExternalStore(immediate ? store.meta.subscribeImmediate : store.meta.subscribeDeferred, store.meta.getSnapshot)
    return hintTuple(store.meta.getValue, store.meta.setValue)
}

export function useSelector<T, U>(store: SimpleStore<T>, selector: (value: T) => U, immediate: boolean = false): StoreValueGetter<U> {
    const latestSelector = useLatest(selector)
    const getValue = useCallback(() => latestSelector()(store.getSnapshot()), [latestSelector, store])
    useSyncExternalStore(immediate ? store.subscribeImmediate : store.subscribeDeferred, getValue)
    return getValue
}

export function useMetaSelector<T, U>(store: TrackedStore<T>, selector: (value: StoreMetaState<T>) => U, immediate: boolean = false) {
    return useSelector(store.meta, selector, immediate)
}

export function subscribeToStore<T>(store: SimpleStore<T>, callback: (newState: T, oldState: T) => void, immediate: boolean = false) {
    return subscribeToSelector(store, s => s, callback, immediate)
}

export function subscribeToStoreAsync<T>(store: SimpleStore<T>, callback: (newState: T, oldState: T) => Promise<void>, immediate: boolean = false) {
    return subscribeToSelectorAsync(store, s => s, callback, immediate)
}

export function subscribeToSelector<T, U>(store: SimpleStore<T>, selector: (state: T) => U, callback: (newValue: U, oldValue: U) => void, immediate: boolean = false) {
    let oldValue = selector(store.getSnapshot())
    const subscribe = immediate ? store.subscribeImmediate : store.subscribeDeferred
    return subscribe(() => {
        const newValue = selector(store.getSnapshot())
        if (newValue !== oldValue) {
            callback(newValue, oldValue)
            oldValue = newValue
        }
    })
}

export function subscribeToSelectorAsync<T, U>(store: SimpleStore<T>, selector: (state: T) => U, callback: (newValue: U, oldValue: U) => Promise<void>, immediate: boolean = false) {
    let updateInProgress = false
    let pendingUpdate: { newState: U, oldState : U } | null = null

    const syncCallback = async (newState: U, oldState: U) => {
        pendingUpdate = pendingUpdate ? { newState, oldState: pendingUpdate.oldState } : { newState, oldState }
        while (pendingUpdate && !updateInProgress) {
            const { newState, oldState } = pendingUpdate
            pendingUpdate = null
            updateInProgress = true
            await callback(newState, oldState)
            updateInProgress = false
        }
    }

    return subscribeToSelector(store, selector, (newState, oldState) => void syncCallback(newState, oldState), immediate)
}
