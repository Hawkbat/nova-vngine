/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { ParseFunc } from '../utils/guard'
import { defineParser, parsers as $ } from '../utils/guard'
import type { RandState } from '../utils/rand'
import type { Branded, OmitUndefined } from '../utils/types'
import { hintTuple } from '../utils/types'
import { parseAnyExpr, type BooleanExpr, type ChapterExpr, type CharacterExpr, type IntegerExpr, type ListExpr, type NumberExpr, type PortraitExpr, type SceneExpr, type StringExpr, type ValueExpr } from './expressions'
import { parseAnyStep, type AnyStep } from './steps'

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
    macro: MacroDefinition
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
    macros: MacroDefinition[]
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
    macro: 'macros',
}

type TypeByProjectKeyMap = { [K in keyof ProjectKeyByTypeMap as ProjectKeyByTypeMap[K]]: K }

const TYPE_BY_PROJECT_KEY_MAP = Object.fromEntries(Object.entries(PROJECT_KEY_BY_TYPE_MAP).map(([k, v]) => hintTuple(v, k))) as TypeByProjectKeyMap

export const ENTITY_TYPES = Object.keys(PROJECT_KEY_BY_TYPE_MAP) as EntityType[]
export const PROJECT_ENTITY_KEYS = Object.values(PROJECT_KEY_BY_TYPE_MAP) as ProjectEntityKey[]

export type ProjectEntityKey = ProjectEntityKeyOf<EntityType>

export type ProjectEntityKeyOf<T extends EntityType> = T extends EntityType ? ProjectKeyByTypeMap[T] : never

export type EntityTypeOfProjectKey<T extends ProjectEntityKey> = TypeByProjectKeyMap[T]

export function getEntityTypeByProjectKey(key: string): EntityType | null {
    if (key in TYPE_BY_PROJECT_KEY_MAP) {
        return TYPE_BY_PROJECT_KEY_MAP[key as keyof TypeByProjectKeyMap]
    }
    return null
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

export function getEntityTypeHierarchy(type: EntityType): EntityType[] {
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
        return ENTITY_PARENT_GETTERS[type as keyof typeof ENTITY_PARENT_GETTERS](entity as any) as EntityParentIDOf<T>
    }
    return null
}

const ENTITY_CHILDREN = Object.fromEntries(ENTITY_TYPES.map(t => hintTuple(t, ENTITY_TYPES.filter(c => getEntityParentType(c) === t)))) as Record<EntityType, EntityType[]>

export function getEntityChildTypes(type: EntityType): EntityType[] {
    return ENTITY_CHILDREN[type]
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
    steps: AnyStep[]
}

export type CharacterID = EntityID<'character'>

export interface CharacterDefinition extends EntityDefinition<CharacterID> {

}

export type PortraitID = EntityID<'portrait'>

export interface PortraitDefinition extends EntityDefinition<PortraitID> {
    characterID: CharacterID
    image: AssetDefinition | null
}

export type BackdropID = EntityID<'backdrop'>

export interface BackdropDefinition extends EntityDefinition<BackdropID> {
    image: AssetDefinition | null
}

export type SongID = EntityID<'song'>

export interface SongDefinition extends EntityDefinition<SongID> {
    audio: AssetDefinition | null
}

export type SoundID = EntityID<'sound'>

export interface SoundDefinition extends EntityDefinition<SoundID> {
    audio: AssetDefinition | null
}

export type VariableID = EntityID<'variable'>

type VariableScopeMap = {
    allStories: undefined
    story: StoryID
    stories: StoryID[]
    allChapters: undefined
    chapter: ChapterID
    chapters: ChapterID[]
    allScenes: undefined
    scene: SceneID
    scenes: SceneID[]
    allCharacters: undefined
    character: CharacterID
    characters: CharacterID[]
    macro: MacroID
    macros: MacroID[]
}

export type VariableScopeType = keyof VariableScopeMap
export type VariableScopeOfType<T extends VariableScopeType> = T extends VariableScopeType ? OmitUndefined<{ type: T, value: VariableScopeMap[T] }> : never
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
        elements: AnyPartialVariableDefinition
        default: ValueExpr
    }
    lookup: {
        keys: AnyPartialVariableDefinition
        elements: AnyPartialVariableDefinition
        default: ValueExpr
    }
}

const VARIABLE_TYPE_MAP = {
    flag: true,
    integer: true,
    number: true,
    text: true,
    singleChoice: true,
    multipleChoice: true,
    chapter: true,
    scene: true,
    character: true,
    portrait: true,
    list: true,
    lookup: true,
} satisfies Record<VariableType, true>

export const VARIABLE_TYPES = Object.keys(VARIABLE_TYPE_MAP) as VariableType[]

export type PartialVariableDefinitionOfType<T extends VariableType> = T extends VariableType ? Omit<VariableDefinitionOfType<T>, 'id' | 'default' | 'name' | 'scope'> : never
export type AnyPartialVariableDefinition = PartialVariableDefinitionOfType<VariableType>

export type VariableType = keyof VariableDefinitionMap
export type VariableDefinitionOfType<T extends VariableType> = T extends VariableType ? EntityDefinition<VariableID> & {
    type: T
    scope: AnyVariableScope
} & VariableDefinitionMap[T] : never
export type AnyVariableDefinition = VariableDefinitionOfType<VariableType>

export type MacroID = EntityID<'macro'>

export interface MacroDefinition extends EntityDefinition<MacroID> {
    steps: AnyStep[]
}

export interface AssetDefinition {
    mimeType: string
    path: string
}

const parseAssetDefinition: ParseFunc<AssetDefinition> = defineParser<AssetDefinition>((c, v, d) => $.object(c, v, {
    mimeType: $.string,
    path: $.string,
}, d))

const parseStoryDefinition: ParseFunc<StoryDefinition> = defineParser<StoryDefinition>((c, v, d) => $.object(c, v, {
    id: $.id,
    name: $.string,
}, d))

const parseChapterDefinition: ParseFunc<ChapterDefinition> = defineParser<ChapterDefinition>((c, v, d) => $.object(c, v, {
    id: $.id,
    name: $.string,
    storyID: $.id,
}, d))

const parseSceneDefinition: ParseFunc<SceneDefinition> = defineParser<SceneDefinition>((c, v, d) => $.object(c, v, {
    id: $.id,
    name: $.string,
    chapterID: $.id,
    steps: (c, v, d) => $.array(c, v, parseAnyStep, d),
}, d))

const parseCharacterDefinition: ParseFunc<CharacterDefinition> = defineParser<CharacterDefinition>((c, v, d) => $.object(c, v, {
    id: $.id,
    name: $.string,
}, d))

const parsePortraitDefinition: ParseFunc<PortraitDefinition> = defineParser<PortraitDefinition>((c, v, d) => $.object(c, v, {
    id: $.id,
    name: $.string,
    characterID: $.id,
    image: (c, v, d) => $.either(c, v, parseAssetDefinition, $.null, d),
}, d))

const parseBackdropDefinition: ParseFunc<BackdropDefinition> = defineParser<BackdropDefinition>((c, v, d) => $.object(c, v, {
    id: $.id,
    name: $.string,
    image: (c, v, d) => $.either(c, v, parseAssetDefinition, $.null, d),
}, d))

const parseSongDefinition: ParseFunc<SongDefinition> = defineParser<SongDefinition>((c, v, d) => $.object(c, v, {
    id: $.id,
    name: $.string,
    audio: (c, v, d) => $.either(c, v, parseAssetDefinition, $.null, d),
}, d))

const parseSoundDefinition: ParseFunc<SoundDefinition> = defineParser<SoundDefinition>((c, v, d) => $.object(c, v, {
    id: $.id,
    name: $.string,
    audio: (c, v, d) => $.either(c, v, parseAssetDefinition, $.null, d),
}, d))

const parseAnyPartialVariableDefinition: ParseFunc<AnyPartialVariableDefinition> = defineParser<AnyPartialVariableDefinition>((c, v, d) => $.typed(c, v, {}, {
    flag: { setValueLabel: parseAnyExpr, unsetValueLabel: parseAnyExpr },
    integer: { },
    number: { },
    text: { },
    singleChoice: { options: parseAnyExpr },
    multipleChoice: { options: parseAnyExpr },
    chapter: { },
    scene: { },
    character: { },
    portrait: { },
    list: { elements: parseAnyPartialVariableDefinition },
    lookup: { elements: parseAnyPartialVariableDefinition, keys: parseAnyPartialVariableDefinition },
}, d))

const parseAnyVariableDefinition: ParseFunc<AnyVariableDefinition> = defineParser<AnyVariableDefinition>((c, v, d) => $.typed(c, v, {
    id: $.id,
    name: $.string,
    scope: (c, v, d) => $.typed(c, v, {}, {
        allStories: { },
        story: { value: $.id },
        stories: { value: (c, v, d) => $.array(c, v, $.id, d) },
        allChapters: {},
        chapter: { value: $.id },
        chapters: { value: (c, v, d) => $.array(c, v, $.id, d) },
        allScenes: {},
        scene: { value: $.id },
        scenes: { value: (c, v, d) => $.array(c, v, $.id, d) },
        allCharacters: {},
        character: { value: $.id },
        characters: { value: (c, v, d) => $.array(c, v, $.id, d) },
        macro: { value: $.id },
        macros: { value: (c, v, d) => $.array(c, v, $.id, d) },
    }, d),
    default: parseAnyExpr,
}, {
    flag: { setValueLabel: parseAnyExpr, unsetValueLabel: parseAnyExpr },
    integer: { },
    number: { },
    text: { },
    singleChoice: { options: parseAnyExpr },
    multipleChoice: { options: parseAnyExpr },
    chapter: { },
    scene: { },
    character: { },
    portrait: { },
    list: { elements: parseAnyPartialVariableDefinition },
    lookup: { elements: parseAnyPartialVariableDefinition, keys: parseAnyPartialVariableDefinition },
}, d))

const parseMacroDefinition: ParseFunc<MacroDefinition> = defineParser<MacroDefinition>((c, v, d) => $.object(c, v, {
    id: $.id,
    name: $.string,
    steps: (c, v, d) => $.array(c, v, parseAnyStep, d),
}, d))

export const parseProjectDefinition: ParseFunc<ProjectDefinition> = defineParser<ProjectDefinition>((c, v, d) => $.object(c, v, {
    id: $.id,
    name: $.string,
    editorRandState: (c, v, d) => $.tuple(c, v, hintTuple(defineParser<'xorshift32'>((c, v, d) => $.enum(c, v, ['xorshift32'], d)), $.integer), d),
    stories: (c, v, d) => $.array(c, v, parseStoryDefinition, d),
    chapters: (c, v, d) => $.array(c, v, parseChapterDefinition, d),
    scenes: (c, v, d) => $.array(c, v, parseSceneDefinition, d),
    characters: (c, v, d) => $.array(c, v, parseCharacterDefinition, d),
    portraits: (c, v, d) => $.array(c, v, parsePortraitDefinition, d),
    backdrops: (c, v, d) => $.array(c, v, parseBackdropDefinition, d),
    songs: (c, v, d) => $.array(c, v, parseSongDefinition, d),
    sounds: (c, v, d) => $.array(c, v, parseSoundDefinition, d),
    variables: (c, v, d) => $.array(c, v, parseAnyVariableDefinition, d),
    macros: (c, v, d) => $.array(c, v, parseMacroDefinition, d),
}, d))
