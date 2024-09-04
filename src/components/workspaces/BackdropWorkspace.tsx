import { getProjectEntityKey } from '../../types/project'
import { immSet } from '../../utils/imm'
import { ImageField } from '../common/ImageField'
import { EntityWorkspace } from './EntityWorkspace'

import styles from './BackdropWorkspace.module.css'

export const BackdropWorkspace = () => {
    return <EntityWorkspace type='backdrop'>{(backdrop, setBackdrop) => <>
        <ImageField value={backdrop.image} setValue={asset => setBackdrop(b => immSet(b, 'image', asset))} label='Image' targetPath={`${getProjectEntityKey('backdrop')}/${backdrop.id}`} />
    </>}</EntityWorkspace>
}
