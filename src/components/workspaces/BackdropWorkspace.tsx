import { EntityWorkspace } from './EntityWorkspace'
import { ImageField } from '../common/ImageField'
import { immSet } from '../../utils/imm'
import { getProjectEntityKey, type BackdropDefinition } from '../../types/project'
import styles from './BackdropWorkspace.module.css'
import { useAsset } from '../../store/assets'

const BackdropPreview = ({ backdrop }: { backdrop: BackdropDefinition }) => {
    const getImgSrc = useAsset(backdrop.image)
    return getImgSrc() ? <img src={getImgSrc() ?? undefined} className={styles.preview} /> : null
}

export const BackdropWorkspace = () => {
    return <EntityWorkspace type='backdrop' preview={backdrop => <BackdropPreview backdrop={backdrop} />}>{(backdrop, setBackdrop) => <>
        <ImageField value={backdrop.image} setValue={asset => setBackdrop(b => immSet(b, 'image', asset))} label='Image' targetPath={`${getProjectEntityKey('backdrop')}/${backdrop.id}`} />
    </>}</EntityWorkspace>
}
