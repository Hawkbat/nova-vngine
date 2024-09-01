import { useAsset } from '../../store/assets'
import { type BackdropDefinition, getProjectEntityKey } from '../../types/project'
import { immSet } from '../../utils/imm'
import { ImageField } from '../common/ImageField'
import { EntityWorkspace } from './EntityWorkspace'

import styles from './BackdropWorkspace.module.css'

const BackdropPreview = ({ backdrop }: { backdrop: BackdropDefinition }) => {
    const getImgSrc = useAsset(backdrop.image)
    return getImgSrc() ? <img src={getImgSrc() ?? undefined} className={styles.preview} /> : null
}

export const BackdropWorkspace = () => {
    return <EntityWorkspace type='backdrop' preview={backdrop => <BackdropPreview backdrop={backdrop} />}>{(backdrop, setBackdrop) => <>
        <ImageField value={backdrop.image} setValue={asset => setBackdrop(b => immSet(b, 'image', asset))} label='Image' targetPath={`${getProjectEntityKey('backdrop')}/${backdrop.id}`} />
    </>}</EntityWorkspace>
}
