import type { SettingsState } from '../types/settings'
import { createSimpleStore } from '../utils/store'

export const settingsStore = createSimpleStore<SettingsState>({
    developerMode: false,
    uiScale: 1,
    menuAnimationEnabled: true,
    scenePlayerSettings: {
        musicVolume: 1,
        soundVolume: 1,
        uiVolume: 1,
        textSpeed: 1,
    },
})
