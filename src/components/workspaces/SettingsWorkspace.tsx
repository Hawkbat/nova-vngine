import { settingsStore } from '../../store/settings'
import { immSet } from '../../utils/imm'
import { useStore } from '../../utils/store'
import { BooleanField } from '../common/BooleanField'
import { NumberField } from '../common/NumberField'

import styles from './SettingsWorkspace.module.css'

export const SettingsWorkspace = () => {
    const [getSettings, setSettings] = useStore(settingsStore)
    return <div className={styles.fields}>
        <BooleanField label='Developer Mode' value={getSettings().developerMode} setValue={v => setSettings(s => immSet(s, 'developerMode', v))} />
        <NumberField label='UI Scale' value={getSettings().uiScale} setValue={v => setSettings(s => immSet(s, 'uiScale', v))} min={0.5} max={2.5} slider />
        <BooleanField label='Enable Animated Menu Background' value={getSettings().menuAnimationEnabled} setValue={v => setSettings(s => immSet(s, 'menuAnimationEnabled', v))} />
        <NumberField label='Music Volume' value={getSettings().scenePlayerSettings.musicVolume} setValue={v => setSettings(s => immSet(s, 'scenePlayerSettings', immSet(s.scenePlayerSettings, 'musicVolume', v)))} slider />
        <NumberField label='Sound Effect Volume' value={getSettings().scenePlayerSettings.soundVolume} setValue={v => setSettings(s => immSet(s, 'scenePlayerSettings', immSet(s.scenePlayerSettings, 'soundVolume', v)))} slider />
        <NumberField label='Interface Sound Volume' value={getSettings().scenePlayerSettings.uiVolume} setValue={v => setSettings(s => immSet(s, 'scenePlayerSettings', immSet(s.scenePlayerSettings, 'uiVolume', v)))} slider />
        <NumberField label='Text Speed' value={getSettings().scenePlayerSettings.textSpeed} setValue={v => setSettings(s => immSet(s, 'scenePlayerSettings', immSet(s.scenePlayerSettings, 'textSpeed', v)))} min={0.2} max={5} slider />
    </div>
}
