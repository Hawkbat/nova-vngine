import { EntityWorkspace } from './EntityWorkspace'
import { ImageField } from '../common/ImageField'
import { immSet } from '../../utils/imm'
import { getProjectEntityKey } from '../../types/project'
import styles from './BackdropWorkspace.module.css'

export const BackdropWorkspace = () => {
    return <EntityWorkspace type='backdrop'>{(backdrop, setBackdrop) => <>
        <ImageField value={backdrop.image} setValue={asset => setBackdrop(b => immSet(b, 'image', asset))} label='Image' targetPath={`${getProjectEntityKey('backdrop')}/${backdrop.id}`} />
    </>}</EntityWorkspace>
}
