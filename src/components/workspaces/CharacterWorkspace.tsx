import { EntityWorkspace } from './EntityWorkspace'

import styles from './CharacterWorkspace.module.css'

export const CharacterWorkspace = () => {
    return <EntityWorkspace type='character' getVariableScopes={character => [{ type: 'character', value: character.id }, { type: 'characters', value: [character.id] }, { type: 'allCharacters' }]}>{character => <>

    </>}</EntityWorkspace>
}
