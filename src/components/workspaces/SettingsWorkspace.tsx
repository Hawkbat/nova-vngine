import { settingsStore } from '../../store/settings'
import { immSet } from '../../utils/imm'
import { useStore } from '../../utils/store'
import { BooleanField } from '../common/BooleanField'

export const SettingsWorkspace = () => {
    const [getSettings, setSettings] = useStore(settingsStore)
    return <>
        <BooleanField label='Developer Mode' value={getSettings().developerMode} setValue={v => setSettings(s => immSet(s, 'developerMode', v))} />
    </>
}
