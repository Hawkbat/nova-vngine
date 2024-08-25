import { RandState } from "../utils/rand"
import { Branded } from "../utils/types"
import { BooleanExpr, ChapterExpr, CharacterExpr, IntegerExpr, ListExpr, NumberExpr, PortraitExpr, SceneExpr, StringExpr, ValueExpr } from "./expressions"

export type ProjectID = Branded<string, 'Project'>

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

export type StoryID = Branded<string, 'Story'>

export interface StoryDefinition {
    id: StoryID
    name: string
}

export type ChapterID = Branded<string, 'Chapter'>

export interface ChapterDefinition {
    id: ChapterID
    name: string
    storyID: StoryID
}

export type SceneID = Branded<string, 'Scene'>

export interface SceneDefinition {
    id: SceneID
    name: string
    chapterID: ChapterID
}

export type CharacterID = Branded<string, 'Character'>

export interface CharacterDefinition {
    id: CharacterID
    name: string
}

export type PortraitID = Branded<string, 'Portrait'>

export interface PortraitDefinition {
    id: PortraitID
    name: string
    characterID: CharacterID
}

export type BackdropID = Branded<string, 'Backdrop'>

export interface BackdropDefinition {
    id: BackdropID
    name: string
}

export type SongID = Branded<string, 'Song'>

export interface SongDefinition {
    id: SongID
    name: string
}

export type SoundID = Branded<string, 'Sound'>

export interface SoundDefinition {
    id: SoundID
    name: string
}

export type VariableID = Branded<string, 'Variable'>

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
export type VariableDefinitionOfType<T extends VariableDefinitionType> = T extends VariableDefinitionType ? {
    id: VariableID
    type: T
    name: string
    scope: AnyVariableScope
} & VariableDefinitionMap[T] : never
export type AnyVariableDefinition = VariableDefinitionOfType<VariableDefinitionType>
