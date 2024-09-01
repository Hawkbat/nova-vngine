import { settingsStore } from '../../store/settings'
import { immSet } from '../../utils/imm'
import { useStore } from '../../utils/store'
import { BooleanField } from '../common/BooleanField'

export const SettingsWorkspace = () => {
    const [settings, setSettings] = useStore(settingsStore)
    return <>
        <BooleanField label='Developer Mode' value={settings.developerMode} setValue={v => setSettings(s => immSet(s, 'developerMode', v))} />
    </>
}
