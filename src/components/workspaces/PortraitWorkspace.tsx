import { useAsset } from '../../store/assets'
import { getProjectEntityKey, type PortraitDefinition } from '../../types/project'
import { immSet } from '../../utils/imm'
import { ImageField } from '../common/ImageField'
import { EntityWorkspace } from './EntityWorkspace'

import styles from './PortraitWorkspace.module.css'

const PortraitPreview = ({ portrait }: { portrait: PortraitDefinition }) => {
    const getImgSrc = useAsset(portrait.image)
    return getImgSrc() ? <img src={getImgSrc() ?? undefined} className={styles.preview} /> : null
}

export const PortraitWorkspace = () => {
    return <EntityWorkspace type='portrait' preview={portrait => <PortraitPreview portrait={portrait} />}>{(portrait, setPortrait) => <>
        <ImageField value={portrait.image} setValue={asset => setPortrait(b => immSet(b, 'image', asset))} label='Image' targetPath={`${getProjectEntityKey('portrait')}/${portrait.id}`} />
    </>}</EntityWorkspace>
}
