import type { MenuScreen } from '../components/player/GamePlayer'
import type { ParseFunc } from '../utils/guard'
import { defineParser, parsers as $ } from '../utils/guard'
import { hintTuple } from '../utils/types'
import type { BackdropID, ChapterID, CharacterID, EntityOfType, EntityType, MacroID, PortraitID, ProjectEntityKey, ProjectEntityKeyOf, SceneID, SongID, SoundID, StoryID, VariableID } from './project'
import { PROJECT_ENTITY_KEYS } from './project'
import type { StepID } from './steps'
import { parseStorageRootEntry, type StorageRootEntry } from './storage'

export type ProjectEditorTab = 'home' | 'play' | 'manual' | 'settings' | 'project' | ProjectEntityKeyOf<EntityType>

const PROJECT_EDITOR_TAB_MAP: Record<ProjectEditorTab, boolean> = {
    home: true,
    play: true,
    project: true,
    ...Object.fromEntries(PROJECT_ENTITY_KEYS.map(k => hintTuple(k, true))) as Record<ProjectEntityKey, true>,
    manual: true,
    settings: true,
}

export const PROJECT_EDITOR_TABS = Object.keys(PROJECT_EDITOR_TAB_MAP) as ProjectEditorTab[]

export type SubEditorViewState = { type: 'sceneSteps', sceneID: SceneID, stepID: StepID | null } | { type: 'macroSteps', macroID: MacroID, stepID: StepID | null } | { type: 'game', menu: MenuScreen }

export interface ProjectMetaData {
    id: string
    name: string
    root: StorageRootEntry
}

export interface ViewState {
    loaded: boolean
    currentTab: ProjectEditorTab
    loadedProject: ProjectMetaData | null
    recentProjects: ProjectMetaData[]
    scopes: { [K in EntityType]: EntityOfType<K>['id'] | null }
    editor: SubEditorViewState | null
}

const parseProjectMetaData: ParseFunc<ProjectMetaData> = defineParser<ProjectMetaData>((c, v, d) => $.object(c, v, {
    id: $.string,
    name: $.string,
    root: parseStorageRootEntry,
}, d))

export const parseSubEditorViewState: ParseFunc<SubEditorViewState> = defineParser<SubEditorViewState>((c, v, d) => $.typed(c, v, {}, {
    sceneSteps: {
        sceneID: $.id,
        stepID: (c, v, d) => $.either<StepID, null>(c, v, $.id, $.null, d),
    },
    macroSteps: {
        macroID: $.id,
        stepID: (c, v, d) => $.either<StepID, null>(c, v, $.id, $.null, d),
    },
    game: {
        menu: (c, v, d) => $.enum(c, v, ['main', 'play', 'stories', 'saves', 'gameover'], d),
    },
}, d))

export const parseViewState: ParseFunc<ViewState> = defineParser<ViewState>((c, v, d) => $.object(c, v, {
    loaded: $.boolean,
    currentTab: (c, v, d) => $.enum(c, v, ['home', 'play', 'manual', 'settings', 'project', ...PROJECT_ENTITY_KEYS], d),
    loadedProject: (c, v, d) => $.either(c, v, parseProjectMetaData, $.null, d),
    recentProjects: (c, v, d) => $.array(c, v, parseProjectMetaData, d),
    scopes: (c, v, d) => $.object(c, v, {
        story: (c, v, d) => $.either<StoryID, null>(c, v, $.id, $.null, d),
        chapter: (c, v, d) => $.either<ChapterID, null>(c, v, $.id, $.null, d),
        scene: (c, v, d) => $.either<SceneID, null>(c, v, $.id, $.null, d),
        character: (c, v, d) => $.either<CharacterID, null>(c, v, $.id, $.null, d),
        portrait: (c, v, d) => $.either<PortraitID, null>(c, v, $.id, $.null, d),
        backdrop: (c, v, d) => $.either<BackdropID, null>(c, v, $.id, $.null, d),
        song: (c, v, d) => $.either<SongID, null>(c, v, $.id, $.null, d),
        sound: (c, v, d) => $.either<SoundID, null>(c, v, $.id, $.null, d),
        variable: (c, v, d) => $.either<VariableID, null>(c, v, $.id, $.null, d),
        macro: (c, v, d) => $.either<MacroID, null>(c, v, $.id, $.null, d),
    }, d),
    editor: (c, v, d) => $.either(c, v, parseSubEditorViewState, $.null, d),
}, d))
