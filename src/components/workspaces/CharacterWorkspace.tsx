import { immCreateCharacter } from "../../store/project"
import { EntityWorkspace } from "./EntityWorkspace"
import styles from './CharacterWorkspace.module.css'

export const CharacterWorkspace = () => {
    return <EntityWorkspace type='character' immCreate={immCreateCharacter}>{character => <>
        
    </>}</EntityWorkspace>
}
