import type { SettingsState } from '../types/settings'
import { createSimpleStore } from '../utils/store'

export const settingsStore = createSimpleStore<SettingsState>({
    developerMode: false,
    uiScale: 1,
})
