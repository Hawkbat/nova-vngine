import { getProjectEntityKey } from '../../types/project'
import { immSet } from '../../utils/imm'
import { AudioField } from '../common/AudioField'
import { EntityWorkspace } from './EntityWorkspace'
import styles from './SoundWorkspace.module.css'

export const SoundWorkspace = () => {
    return <EntityWorkspace type='sound'>{(sound, setSound) => <>
        <AudioField value={sound.audio} setValue={asset => setSound(b => immSet(b, 'audio', asset))} label='Audio' targetPath={`${getProjectEntityKey('sound')}/${sound.id}`} />
    </>}</EntityWorkspace>
}
