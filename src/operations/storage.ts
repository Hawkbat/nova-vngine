import { getStorageProvider } from '../storage/storage'
import { viewStateStore } from '../store/viewstate'
import { PROJECT_ENTITY_KEYS } from '../types/project'
import { useSelector } from '../utils/store'

export function getProjectStorage() {
    const root = viewStateStore.getSnapshot().loadedProject?.root ?? null
    const storage = getStorageProvider(root?.type)
    return { storage, root }
}

export function useProjectStorage() {
    const getRoot = useSelector(viewStateStore, s => s.loadedProject?.root ?? null)
    const storage = getStorageProvider(getRoot()?.type)
    const readonly = storage.storeAsset && storage.storeBinary && storage.storeText ? false : true
    return { storage, getRoot, readonly }
}

export function useProjectReadonly() {
    const getTab = useSelector(viewStateStore, s => s.currentTab)
    const { readonly } = useProjectStorage()
    if (getTab() !== 'project' && !(PROJECT_ENTITY_KEYS as string[]).includes(getTab())) {
        return false
    }
    return readonly
}
