import { getProjectEntityKey } from '../../types/project'
import { immSet } from '../../utils/imm'
import { AudioField } from '../common/AudioField'
import { EntityWorkspace } from './EntityWorkspace'

import styles from './SongWorkspace.module.css'

export const SongWorkspace = () => {
    return <EntityWorkspace type='song'>{(song, setSong) => <>
        <AudioField value={song.audio} setValue={asset => setSong(b => immSet(b, 'audio', asset))} label='Audio' targetPath={`${getProjectEntityKey('song')}/${song.id}`} />
    </>}</EntityWorkspace>
}
