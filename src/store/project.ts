import { AnyVariableDefinition, BackdropDefinition, BackdropID, ChapterDefinition, ChapterID, CharacterDefinition, CharacterID, EntityDefinition, EntityIDOf, EntityOfType, EntityParentOf, EntityType, getEntityParentID, getEntityParentType, getProjectEntityKey, PortraitDefinition, PortraitID, ProjectDefinition, ProjectID, SceneDefinition, SceneID, SongDefinition, SongID, SoundDefinition, SoundID, StoryDefinition, StoryID, VariableID } from "../types/definitions"
import { createDefaultExpr } from "../types/expressions"
import { immAppend, immSet } from "../utils/imm"
import { randID, randSeedRandom } from "../utils/rand"
import { createTrackedStore } from "../utils/store"
import { hintTypeTuple } from "../utils/types"

export const projectStore = createTrackedStore(createProject())

export function createProject(): ProjectDefinition {
    const [editorRandState, id] = randID(randSeedRandom())

    const project: ProjectDefinition = {
        id: id as ProjectID,
        name: '',
        editorRandState,
        stories: [],
        chapters: [],
        scenes: [],
        characters: [],
        portraits: [],
        backdrops: [],
        songs: [],
        sounds: [],
        variables: [],
    }

    return project
}

export function getEntityByID<T extends EntityType>(type: T, id: EntityIDOf<T>): EntityOfType<T> | null {
    const project = projectStore.getSnapshot()
    const key = getProjectEntityKey(type)
    const entities = project[key]
    const entity = entities.find(e => e.id === id)
    if (entity) return entity as EntityOfType<T>
    return null
}

export function getEntityParent<T extends EntityType>(type: T, entity: EntityOfType<T>): EntityOfType<EntityParentOf<T>> | null {
    const parentType = getEntityParentType(type)
    if (!parentType) return null
    const parentID = getEntityParentID(type, entity)
    if (!parentID) return null
    const parent = getEntityByID(parentType, parentID)
    if (!parent) return null
    return parent
}

type EntityPair<T extends EntityType> = { type: T, entity: EntityOfType<T> }

export function getEntityHierarchy<T extends EntityType>(type: T, id: EntityIDOf<T>): EntityPair<EntityType>[] {
    const entity = getEntityByID(type, id)
    if (!entity) return []
    const parentType = getEntityParentType(type)
    const parentID = getEntityParentID(type, entity)
    if (parentType && parentID) return [...getEntityHierarchy(parentType, parentID), { type, entity }]
    return [{ type, entity }]
}

function immGenerateID<T extends string>(project: ProjectDefinition): [ProjectDefinition, T] {
    const [editorRandState, id] = randID(project.editorRandState)
    return hintTypeTuple(immSet(project, 'editorRandState', editorRandState), id as T)
}

export function immCreateStory(project: ProjectDefinition): [ProjectDefinition, StoryDefinition] {
    let id: StoryID
    [project, id] = immGenerateID(project)

    const story: StoryDefinition = {
        id,
        name: '',
    }

    return hintTypeTuple(immSet(project, 'stories', immAppend(project.stories, story)), story)
}

export function immCreateChapter(project: ProjectDefinition, storyID: StoryID): [ProjectDefinition, ChapterDefinition] {
    let id: ChapterID
    [project, id] = immGenerateID(project)

    const chapter: ChapterDefinition = {
        id,
        name: '',
        storyID,
    }

    return hintTypeTuple(immSet(project, 'chapters', immAppend(project.chapters, chapter)), chapter)
}

export function immCreateScene(project: ProjectDefinition, chapterID: ChapterID): [ProjectDefinition, SceneDefinition] {
    let id: SceneID
    [project, id] = immGenerateID(project)

    const scene: SceneDefinition = {
        id,
        name: '',
        chapterID,
    }

    return hintTypeTuple(immSet(project, 'scenes', immAppend(project.scenes, scene)), scene)
}

export function immCreateCharacter(project: ProjectDefinition): [ProjectDefinition, CharacterDefinition] {
    let id: CharacterID
    [project, id] = immGenerateID(project)

    const character: CharacterDefinition = {
        id,
        name: '',
    }

    return hintTypeTuple(immSet(project, 'characters', immAppend(project.characters, character)), character)
}

export function immCreatePortrait(project: ProjectDefinition, characterID: CharacterID): [ProjectDefinition, PortraitDefinition] {
    let id: PortraitID
    [project, id] = immGenerateID(project)

    const portrait: PortraitDefinition = {
        id,
        name: '',
        characterID,
    }

    return hintTypeTuple(immSet(project, 'portraits', immAppend(project.portraits, portrait)), portrait)
}

export function immCreateBackdrop(project: ProjectDefinition): [ProjectDefinition, BackdropDefinition] {
    let id: BackdropID
    [project, id] = immGenerateID(project)

    const backdrop: BackdropDefinition = {
        id,
        name: '',
    }

    return hintTypeTuple(immSet(project, 'backdrops', immAppend(project.backdrops, backdrop)), backdrop)
}

export function immCreateSong(project: ProjectDefinition): [ProjectDefinition, SongDefinition] {
    let id: SongID
    [project, id] = immGenerateID(project)

    const song: SongDefinition = {
        id,
        name: '',
    }

    return hintTypeTuple(immSet(project, 'songs', immAppend(project.songs, song)), song)
}

export function immCreateSound(project: ProjectDefinition): [ProjectDefinition, SoundDefinition] {
    let id: SoundID
    [project, id] = immGenerateID(project)

    const sound: SoundDefinition = {
        id,
        name: '',
    }

    return hintTypeTuple(immSet(project, 'sounds', immAppend(project.sounds, sound)), sound)
}

export function immCreateVariable(project: ProjectDefinition): [ProjectDefinition, AnyVariableDefinition] {
    let id: VariableID
    [project, id] = immGenerateID(project)

    const variable: AnyVariableDefinition = {
        id,
        name: '',
        type: 'flag',
        scope: { type: 'allStories' },
        default: createDefaultExpr('boolean'),
        setValueLabel: createDefaultExpr('unset'),
        unsetValueLabel: createDefaultExpr('unset'),
    }

    return hintTypeTuple(immSet(project, 'variables', immAppend(project.variables, variable)), variable)
}
