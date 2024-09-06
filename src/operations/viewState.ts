import { useCallback } from 'react'

import { platform } from '../platform/platform'
import { viewStateStore } from '../store/viewstate'
import { isPlatformErrorCode } from '../types/platform'
import { ENTITY_TYPES, type EntityIDOf, type EntityType, getEntityTypeHierarchy } from '../types/project'
import type { ProjectEditorTab } from '../types/viewstate'
import { immSet } from '../utils/imm'
import { useSelector } from '../utils/store'
import { hintTuple } from '../utils/types'
import { getEntityHierarchy, loadProject } from './project'

export function useViewStateTab() {
    const getTab = useSelector(viewStateStore, s => s.currentTab)
    const setTab = useCallback((tab: ProjectEditorTab) => {
        viewStateStore.setValue(s => immSet(s, 'currentTab', tab))
    }, [])
    return hintTuple(getTab, setTab)
}

export function useViewStateScope<T extends EntityType>(type: T | null): [() => EntityIDOf<T> | null, (id: EntityIDOf<T> | null) => void] {
    const getScopes = useSelector(viewStateStore, s => s.scopes)
    const getScope = useCallback(() => type ? getScopes()[type] as EntityIDOf<T> | null : null, [getScopes, type])
    const setScope = useCallback((id: EntityIDOf<T> | null) => {
        if (!type) return
        if (!id) {
            const subTypes = ENTITY_TYPES.filter(e => getEntityTypeHierarchy(e).includes(type))
            const scopeValues = Object.fromEntries(subTypes.map(t => hintTuple(t, null)))
            viewStateStore.setValue(s => ({ ...s, scopes: { ...s.scopes, ...scopeValues }, editor: null }))
            return
        }
        const hierarchy = getEntityHierarchy(type, id)
        const scopeValues = Object.fromEntries(hierarchy.map(h => hintTuple(h.type, h.entity.id)))
        viewStateStore.setValue(s => ({ ...s, scopes: { ...s.scopes, ...scopeValues }, editor: null }))
    }, [type])
    return hintTuple(getScope, setScope)
}export async function loadInitialViewState() {
    const viewState = await platform.loadViewState()
    viewStateStore.setValue(() => viewState)
    try {
        if (viewState.loadedProject && await loadProject(viewState.loadedProject.root)) {
            return
        }
    } catch (err) {
        if (isPlatformErrorCode(err, 'bad-project')) {
            void platform.error('Failed to load previously loaded project', err)
        } else {
            throw err
        }
    }
    viewStateStore.setValue(s => ({
        ...s,
        currentTab: 'home',
        loadedProject: null,
        loaded: true,
    }))
}

