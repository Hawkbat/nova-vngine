import { AnyVariableDefinition, BackdropDefinition, BackdropID, ChapterDefinition, ChapterID, CharacterDefinition, CharacterID, EntityIDOf, EntityOfType, EntityParentOf, EntityType, getEntityParentID, getEntityParentType, getProjectEntityKey, PortraitDefinition, PortraitID, ProjectDefinition, ProjectID, SceneDefinition, SceneID, SongDefinition, SongID, SoundDefinition, SoundID, StoryDefinition, StoryID, VariableID } from "../types/definitions"
import { createDefaultExpr, ExprContext, resolveExpr } from "../types/expressions"
import { immAppend, immSet } from "../utils/imm"
import { randID, randSeedRandom } from "../utils/rand"
import { createTrackedStore } from "../utils/store"
import { hintTypeTuple } from "../utils/types"
import { viewStateStore } from "./viewstate"

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
        macros: [],
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

export function immGenerateID<T extends string>(project: ProjectDefinition): [ProjectDefinition, T] {
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
        steps: [],
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

    const ctx = getProjectExprContext()

    const variable: AnyVariableDefinition = {
        id,
        name: '',
        type: 'flag',
        scope: { type: 'allStories' },
        default: createDefaultExpr('boolean', ctx),
        setValueLabel: createDefaultExpr('unset', ctx),
        unsetValueLabel: createDefaultExpr('unset', ctx),
    }

    return hintTypeTuple(immSet(project, 'variables', immAppend(project.variables, variable)), variable)
}

export function getProjectExprContext(): ExprContext {
    const project = projectStore.getSnapshot()
    const scopes = viewStateStore.getSnapshot().scopes

    const getSuggestions = <T extends EntityType>(type: T): EntityIDOf<T>[] => {
        const projectKey = getProjectEntityKey(type)
        const values = project[projectKey]
        return values.sort((a, b) => {
            if (a.id === scopes[type]) return -1
            if (b.id === scopes[type]) return 1
            return 0
        }).map(v => v.id) as EntityIDOf<T>[]
    }

    const ctx: ExprContext = {
        suggestions: {
            story: () => getSuggestions('story'),
            chapter: () => getSuggestions('chapter'),
            scene: () => getSuggestions('scene'),
            character: () => getSuggestions('character'),
            portrait: () => getSuggestions('portrait'),
            backdrop: () => getSuggestions('backdrop'),
            song: () => getSuggestions('song'),
            sound: () => getSuggestions('sound'),
            macro: () => getSuggestions('macro'),
            variable: () => getSuggestions('variable'),
        },
        resolvers: {
            story: id => project.stories.find(e => e.id === id) ?? null,
            chapter: id => project.chapters.find(e => e.id === id) ?? null,
            scene: id => project.scenes.find(e => e.id === id) ?? null,
            character: id => project.characters.find(e => e.id === id) ?? null,
            portrait: id => project.portraits.find(e => e.id === id) ?? null,
            backdrop: id => project.backdrops.find(e => e.id === id) ?? null,
            song: id => project.songs.find(e => e.id === id) ?? null,
            sound: id => project.sounds.find(e => e.id === id) ?? null,
            macro: id => project.macros.find(e => e.id === id) ?? null,
            variable: id => project.variables.find(e => e.id === id) ?? null,
            variableValue: id => resolveExpr(project.variables.find(e => e.id === id)?.default ?? createDefaultExpr('unset', ctx), ctx),
        },
    }
    return ctx
}
