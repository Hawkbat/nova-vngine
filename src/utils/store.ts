import { useSyncExternalStore } from 'react'
import { hintTuple } from './types'
import { deepDiff, immSet } from './imm'
import { LOG_STORE_DIFFS } from '../debug'

export type StoreValueSetter<T> = (oldValue: T) => T

export function createSimpleStore<T>(defaultValue: T) {
    const listeners = new Set<() => void>()
    let value = defaultValue

    const subscribe = (listener: () => void) => {
        listeners.add(listener)
        return () => {
            listeners.delete(listener)
        }
    }
    const notify = () => listeners.forEach(l => l())
    const getSnapshot = () => value
    const setValue = (setter: StoreValueSetter<T>) => {
        const newValue = setter(value)
        if (newValue !== value) {
            if (LOG_STORE_DIFFS) {
                console.log(deepDiff(value, newValue, 'value'))
            }
            value = newValue
            notify()
        }
    }

    return {
        subscribe,
        notify,
        getSnapshot,
        setValue,
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
            const newValue = s.undos[0]
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
            const newValue = s.redos[0]
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

export function useStore<T>(store: SimpleStore<T>) {
    const state = useSyncExternalStore(store.subscribe, store.getSnapshot)
    return hintTuple(state, store.setValue)
}

export function useMetaStore<T>(store: TrackedStore<T>) {
    const state = useSyncExternalStore(store.meta.subscribe, store.meta.getSnapshot)
    return hintTuple(state, store.meta.setValue)
}

export function useSelector<T, U>(store: SimpleStore<T>, selector: (value: T) => U) {
    const state = useSyncExternalStore(store.subscribe, () => selector(store.getSnapshot()))
    return hintTuple(state, store.setValue)
}

export function useMetaSelector<T, U>(store: TrackedStore<T>, selector: (value: StoreMetaState<T>) => U) {
    const state = useSyncExternalStore(store.meta.subscribe, () => selector(store.meta.getSnapshot()))
    return hintTuple(state, store.meta.setValue)
}

export function subscribeToStore<T>(store: SimpleStore<T>, callback: (newState: T, oldState: T) => void) {
    return subscribeToSelector(store, s => s, callback)
}

export function subscribeToStoreAsync<T>(store: SimpleStore<T>, callback: (newState: T, oldState: T) => Promise<void>) {
    return subscribeToSelectorAsync(store, s => s, callback)
}

export function subscribeToSelector<T, U>(store: SimpleStore<T>, selector: (state: T) => U, callback: (newValue: U, oldValue: U) => void) {
    let oldValue = selector(store.getSnapshot())
    return store.subscribe(() => {
        const newValue = selector(store.getSnapshot())
        if (newValue !== oldValue) {
            callback(newValue, oldValue)
            oldValue = newValue
        }
    })
}

export function subscribeToSelectorAsync<T, U>(store: SimpleStore<T>, selector: (state: T) => U, callback: (newValue: U, oldValue: U) => Promise<void>) {
    let updateInProgress = false
    let pendingUpdate = false

    const syncCallback = async (newState: U, oldState: U) => {
        pendingUpdate = true
        while (pendingUpdate && !updateInProgress) {
            pendingUpdate = false
            updateInProgress = true
            await callback(newState, oldState)
            updateInProgress = false
        }
    }

    return subscribeToSelector(store, selector, (newState, oldState) => void syncCallback(newState, oldState))
}
