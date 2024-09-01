import { EntityWorkspace } from './EntityWorkspace'
import type { CharacterDefinition } from '../../types/project'
import { useSelector } from '../../utils/store'
import { projectStore } from '../../store/project'
import { useAsset } from '../../store/assets'
import { arrayHead } from '../../utils/array'
import styles from './CharacterWorkspace.module.css'

const CharacterPreview = ({ character }: { character: CharacterDefinition }) => {
    const getPortraits = useSelector(projectStore, s => s.portraits)
    const characterPortraits = getPortraits().filter(p => p.characterID === character.id)
    const defaultPortrait = arrayHead(characterPortraits)
    const getPortraitImgSrc = useAsset(defaultPortrait?.image ?? null)
    return getPortraitImgSrc() ? <img src={getPortraitImgSrc() ?? undefined} className={styles.preview} /> : null
}

export const CharacterWorkspace = () => {
    return <EntityWorkspace type='character' preview={character => <CharacterPreview character={character} />}>{character => <>

    </>}</EntityWorkspace>
}
