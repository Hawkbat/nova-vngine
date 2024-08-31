import { immCreateBackdrop } from '../../store/operations'
import { EntityWorkspace } from './EntityWorkspace'
import { ImageField } from '../common/ImageField'
import { immSet } from '../../utils/imm'
import { getProjectEntityKey } from '../../types/project'
import styles from './BackdropWorkspace.module.css'

export const BackdropWorkspace = () => {
    return <EntityWorkspace type='backdrop' immCreate={immCreateBackdrop}>{(backdrop, setBackdrop) => <>
        <ImageField value={backdrop.image} setValue={asset => setBackdrop(b => immSet(b, 'image', asset))} label='Image' targetPath={`${getProjectEntityKey('backdrop')}/${backdrop.id}`} />
    </>}</EntityWorkspace>
}
