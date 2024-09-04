import { getProjectEntityKey } from '../../types/project'
import { immSet } from '../../utils/imm'
import { ImageField } from '../common/ImageField'
import { LocationHeightField } from '../common/LocationField'
import { EntityWorkspace } from './EntityWorkspace'

import styles from './PortraitWorkspace.module.css'

export const PortraitWorkspace = () => {
    return <EntityWorkspace type='portrait'>{(portrait, setPortrait) => <>
        <ImageField value={portrait.image} setValue={asset => setPortrait(p => immSet(p, 'image', asset))} label='Image' targetPath={`${getProjectEntityKey('portrait')}/${portrait.id}`} />
        <LocationHeightField label='Height' value={portrait.height} setValue={height => setPortrait(p => immSet(p, 'height', height))} />
    </>}</EntityWorkspace>
}
