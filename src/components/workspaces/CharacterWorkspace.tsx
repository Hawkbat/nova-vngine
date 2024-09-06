import { projectStore } from '../../store/project'
import type { CharacterDefinition, PortraitID } from '../../types/project'
import { immSet } from '../../utils/imm'
import { useSelector } from '../../utils/store'
import { EntityField } from '../common/EntityField'
import { EntityWorkspace } from './EntityWorkspace'

import styles from './CharacterWorkspace.module.css'

const CharacterEditor = ({ character, setCharacter }: { character: CharacterDefinition, setCharacter: (setter: (character: CharacterDefinition) => CharacterDefinition) => void }) => {
    const portraits = useSelector(projectStore, s => s.portraits)().filter(c => c.characterID === character.id)
    return <>
        <EntityField label='Main Portrait' type='portrait' value={character.mainPortraitID ?? '' as PortraitID} setValue={portraitID => setCharacter(s => immSet(s, 'mainPortraitID', portraitID ? portraitID : null))} options={portraits} />
    </>
}

export const CharacterWorkspace = () => {
    return <EntityWorkspace type='character' getVariableScopes={character => [{ type: 'character', value: character.id }, { type: 'characters', value: [character.id] }, { type: 'allCharacters' }]}>{(character, setCharacter) => <CharacterEditor key={character.id} character={character} setCharacter={setCharacter} />}</EntityWorkspace>
}
