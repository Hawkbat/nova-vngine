import { immCreatePortrait } from '../../store/operations'
import { getProjectEntityKey } from '../../types/project'
import { immSet } from '../../utils/imm'
import { ImageField } from '../common/ImageField'
import { EntityWorkspace } from './EntityWorkspace'
import styles from './PortraitWorkspace.module.css'

export const PortraitWorkspace = () => {
    return <EntityWorkspace type='portrait' immCreate={immCreatePortrait}>{(portrait, setPortrait) => <>
        <ImageField value={portrait.image} setValue={asset => setPortrait(b => immSet(b, 'image', asset))} label='Image' targetPath={`${getProjectEntityKey('portrait')}/${portrait.id}`} />
    </>}</EntityWorkspace>
}
