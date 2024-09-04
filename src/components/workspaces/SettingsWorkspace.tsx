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
        <NumberField label='UI Scale' value={getSettings().uiScale} setValue={v => setSettings(s => immSet(s, 'uiScale', v))} />
    </div>
}
