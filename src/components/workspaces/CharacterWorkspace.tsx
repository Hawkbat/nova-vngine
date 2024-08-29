import { immCreateCharacter } from '../../store/operations'
import { EntityWorkspace } from './EntityWorkspace'
import styles from './CharacterWorkspace.module.css'

export const CharacterWorkspace = () => {
    return <EntityWorkspace type='character' immCreate={immCreateCharacter}>{character => <>

    </>}</EntityWorkspace>
}
