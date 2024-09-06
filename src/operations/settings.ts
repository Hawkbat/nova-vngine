import { platform } from '../platform/platform'
import { settingsStore } from '../store/settings'

export async function loadInitialSettings() {
    const viewState = await platform.loadSettings()
    settingsStore.setValue(() => viewState)
}
