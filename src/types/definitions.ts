import { RandState } from "../utils/rand"
import { Branded, hintTypeTuple } from "../utils/types"
import { BooleanExpr, ChapterExpr, CharacterExpr, IntegerExpr, ListExpr, NumberExpr, PortraitExpr, SceneExpr, StringExpr, ValueExpr } from "./expressions"

type EntityID<T extends EntityType> = Branded<string, T>

export interface EntityDefinition<T extends EntityID<EntityType>> {
    id: T
    name: string
}

type EntityTypeMap = {
    story: StoryDefinition
    chapter: ChapterDefinition
    scene: SceneDefinition
    character: CharacterDefinition
    portrait: PortraitDefinition
    backdrop: BackdropDefinition
    song: SongDefinition
    sound: SoundDefinition
    variable: AnyVariableDefinition
}

export type EntityType = keyof EntityTypeMap
export type EntityOfType<T extends EntityType> = T extends EntityType ? EntityTypeMap[T] : never
export type EntityIDOf<T extends EntityType> = T extends EntityType ? EntityOfType<T>['id'] : never

export type ProjectID = Branded<string, 'project'>

export interface ProjectDefinition {
    id: ProjectID
    name: string
    editorRandState: RandState
    stories: StoryDefinition[]
    chapters: ChapterDefinition[]
    scenes: SceneDefinition[]
    characters: CharacterDefinition[]
    portraits: PortraitDefinition[]
    backdrops: BackdropDefinition[]
    songs: SongDefinition[]
    sounds: SoundDefinition[]
    variables: AnyVariableDefinition[]
}

type ProjectKeyByTypeMap = {
    [K in EntityType]-?: keyof {
        [L in keyof ProjectDefinition as ProjectDefinition[L] extends EntityDefinition<infer U>[] ?
        U extends EntityOfType<K>['id'] ? L : never
        : never]: L
    }
}

const PROJECT_KEY_BY_TYPE_MAP: ProjectKeyByTypeMap = {
    story: 'stories',
    chapter: 'chapters',
    scene: 'scenes',
    character: 'characters',
    portrait: 'portraits',
    backdrop: 'backdrops',
    song: 'songs',
    sound: 'sounds',
    variable: 'variables',
}

type TypeByProjectKeyMap = { [K in keyof ProjectKeyByTypeMap as ProjectKeyByTypeMap[K]]: K }

const TYPE_BY_PROJECT_KEY_MAP = Object.fromEntries(Object.entries(PROJECT_KEY_BY_TYPE_MAP).map(([k, v]) => hintTypeTuple(v, k))) as TypeByProjectKeyMap

export const ENTITY_TYPES = Object.keys(PROJECT_KEY_BY_TYPE_MAP) as EntityType[]
export const PROJECT_ENTITY_KEYS = Object.values(PROJECT_KEY_BY_TYPE_MAP) as ProjectEntityKey[]

export type ProjectEntityKey = ProjectEntityKeyOf<EntityType>

export type ProjectEntityKeyOf<T extends EntityType> = T extends EntityType ? ProjectKeyByTypeMap[T] : never

export type EntityTypeOfProjectKey<T extends ProjectEntityKey> = TypeByProjectKeyMap[T]

export function getEntityTypeByProjectKey<T extends ProjectEntityKey>(key: T): EntityTypeOfProjectKey<T> {
    return TYPE_BY_PROJECT_KEY_MAP[key] as EntityTypeOfProjectKey<T>
}

export function getProjectEntityKey<T extends EntityType>(type: T): ProjectEntityKeyOf<T> {
    return PROJECT_KEY_BY_TYPE_MAP[type] as ProjectEntityKeyOf<T>
}

export function isEntityType(str: string): str is EntityType {
    return str in PROJECT_KEY_BY_TYPE_MAP
}

export function isProjectEntityKey(str: string): str is ProjectEntityKey {
    return str in TYPE_BY_PROJECT_KEY_MAP
}

const ENTITY_PARENTS = {
    chapter: 'story',
    scene: 'chapter',
    portrait: 'character',
} satisfies { [K in EntityType]?: EntityType }

type EntityParentMap = typeof ENTITY_PARENTS

export type EntityParentOf<T extends EntityType> = T extends keyof EntityParentMap ? EntityParentMap[T] : never

export type EntityParentIDOf<T extends EntityType> = T extends keyof EntityParentMap ? EntityIDOf<EntityParentMap[T]> : never

export function getEntityParentType<T extends EntityType>(type: T): EntityParentOf<T> | null {
    if (type in ENTITY_PARENTS) return ENTITY_PARENTS[type as keyof EntityParentMap] as EntityParentOf<T>
    return null
}

export function getEntityTypeHierarchy<T extends EntityType>(type: T): EntityType[] {
    if (type in ENTITY_PARENTS) return [...getEntityTypeHierarchy(ENTITY_PARENTS[type as keyof EntityParentMap]), type]
    return [type]
}

const ENTITY_PARENT_GETTERS = {
    chapter: c => c.storyID,
    scene: s => s.chapterID,
    portrait: p => p.characterID,
} satisfies { [K in keyof EntityParentMap]: (entity: EntityOfType<K>) => EntityID<EntityParentMap[K]> }

export function getEntityParentID<T extends EntityType>(type: T, entity: EntityOfType<T>): EntityParentIDOf<T> | null {
    if (type in ENTITY_PARENT_GETTERS) {
        return (ENTITY_PARENT_GETTERS as any)[type](entity)
    }
    return null
}

export type StoryID = EntityID<'story'>

export interface StoryDefinition extends EntityDefinition<StoryID> {

}

export type ChapterID = EntityID<'chapter'>

export interface ChapterDefinition extends EntityDefinition<ChapterID> {
    storyID: StoryID
}

export type SceneID = EntityID<'scene'>

export interface SceneDefinition extends EntityDefinition<SceneID> {
    chapterID: ChapterID
}

export type CharacterID = EntityID<'character'>

export interface CharacterDefinition extends EntityDefinition<CharacterID> {

}

export type PortraitID = EntityID<'portrait'>

export interface PortraitDefinition extends EntityDefinition<PortraitID> {
    characterID: CharacterID
}

export type BackdropID = EntityID<'backdrop'>

export interface BackdropDefinition extends EntityDefinition<BackdropID> {

}

export type SongID = EntityID<'song'>

export interface SongDefinition extends EntityDefinition<SongID> {
    
}

export type SoundID = EntityID<'sound'>

export interface SoundDefinition extends EntityDefinition<SoundID> {
    
}

export type VariableID = EntityID<'variable'>

type VariableScopeMap = {
    allStories: { }
    story: { id: StoryID }
    stories: { ids: StoryID[] }
    allChapters: { }
    chapter: { id: ChapterID }
    chapters: { ids: ChapterID[] }
    allScenes: { }
    scene: { id: SceneID }
    scenes: { ids: SceneID[] }
    allCharacters: { }
    character: { id: CharacterID }
    characters: { ids: CharacterID[] }
}

export type VariableScopeType = keyof VariableScopeMap
export type VariableScopeOfType<T extends VariableScopeType> = T extends VariableScopeType ? { type: T } & VariableScopeMap[T] : never
export type AnyVariableScope = VariableScopeOfType<VariableScopeType>

type VariableDefinitionMap = {
    flag: {
        default: BooleanExpr
        setValueLabel: StringExpr
        unsetValueLabel: StringExpr
    }
    integer: {
        default: IntegerExpr
    }
    number: {
        default: NumberExpr
    }
    text: {
        default: StringExpr
    }
    singleChoice: {
        default: ValueExpr
        options: ListExpr
    }
    multipleChoice: {
        default: ListExpr
        options: ListExpr
    }
    chapter: {
        default: ChapterExpr
    }
    scene: {
        default: SceneExpr
    }
    character: {
        default: CharacterExpr
    }
    portrait: {
        default: PortraitExpr
    }
    list: {
        elements: Omit<AnyVariableDefinition, 'id' | 'default' | 'name' | 'scope'>
        default: ValueExpr
    }
    lookup: {
        keys: Omit<AnyVariableDefinition, 'id' | 'default' | 'name' | 'scope'>
        elements: Omit<AnyVariableDefinition, 'id' | 'default' | 'name' | 'scope'>
        default: ValueExpr
    }
}

export type VariableDefinitionType = keyof VariableDefinitionMap
export type VariableDefinitionOfType<T extends VariableDefinitionType> = T extends VariableDefinitionType ? EntityDefinition<VariableID> & {
    type: T
    scope: AnyVariableScope
} & VariableDefinitionMap[T] : never
export type AnyVariableDefinition = VariableDefinitionOfType<VariableDefinitionType>
