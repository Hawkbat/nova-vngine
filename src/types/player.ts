import { defineParser, type ParseFunc, parsers as $, throwIfNull } from '../utils/guard'
import { randSeedRandom, type RandState, uncheckedRandID } from '../utils/rand'
import { hintTuple } from '../utils/types'
import type { AnyExprValue, ExprContext, ExprValueType, LocationValue } from './expressions'
import type { BackdropID, ChapterID, CharacterID, MacroID, PortraitID, SceneID, SongID, SoundID, StoryID, VariableID } from './project'
import { type AnyStep, prettyPrintStep, type StepID } from './steps'

interface GamePlayerAction<T extends string> {
    type: T
}

export interface GamePlayerActionSubmitPrompt extends GamePlayerAction<'prompt'> {
    stepID: StepID
    value: unknown
}

export interface GamePlayerActionRandomizePrompt extends GamePlayerAction<'randomize'> {
    stepID: StepID
}

export interface GamePlayerActionDecision extends GamePlayerAction<'decision'> {
    stepID: StepID
    index: number
}

export type AnyGamePlayerAction =
    | GamePlayerActionSubmitPrompt
    | GamePlayerActionRandomizePrompt
    | GamePlayerActionDecision

export type GamePlayerActionType = AnyGamePlayerAction['type']

export type GamePlayerActionOfType<T extends GamePlayerActionType> = Extract<AnyGamePlayerAction, { type: T }>

export interface GamePlayerState {
    currentSave: GameSaveState | null
}

export interface GameSaveState {
    id: string
    randState: RandState
    actions: AnyGamePlayerAction[]
    storyID: StoryID
    stopAfter: StepID | null
}

export interface MacroPlayerEvalState {
    id: MacroID
    variables: Record<VariableID, AnyExprValue>
}

export interface CharacterPlayerEvalState {
    variables: Record<VariableID, AnyExprValue>
}

export interface ScenePlayerEvalState {
    id: SceneID
    variables: Record<VariableID, AnyExprValue>
}

export interface ChapterPlayerEvalState {
    id: ChapterID
    variables: Record<VariableID, AnyExprValue>
    scene: ScenePlayerEvalState | null
}

export interface StoryPlayerEvalState {
    id: StoryID
    variables: Record<VariableID, AnyExprValue>
    chapter: ChapterPlayerEvalState | null
    characters: Record<CharacterID, CharacterPlayerEvalState>
}

export interface GamePlayerEvalState {
    randState: RandState
    story: StoryPlayerEvalState | null
    macros: MacroPlayerEvalState[]
    stoppedAt: AnyStep | null
}

export interface CharacterPlayerState {
    characterID: CharacterID
    portraitID: PortraitID
    location: LocationValue
}

export interface BackdropPlayerState {
    backdropID: BackdropID
    dir: -1 | 0 | 1
}

export interface SongPlayerState {
    songID: SongID | null
}

export interface SoundPlayerState {
    soundID: SoundID
}

export interface DialoguePlayerState {
    speakerID: CharacterID | null
    speakerAlias: string | null
    text: string | null
    mode: 'adv' | 'nvl' | 'pop'
}

export interface OptionPlayerState {
    index: number
    enabled: boolean
    text: string
}

export interface PromptPlayerState {
    label: string
    type: ExprValueType
    initialValue: unknown
    randomizable: boolean
}

export interface ScenePlayerSettingsState {
    musicVolume: number
    soundVolume: number
    uiVolume: number
    textSpeed: number
}

export interface ScenePlayerState {
    settings: ScenePlayerSettingsState
    characters: CharacterPlayerState[]
    backdrops: BackdropPlayerState[]
    song: SongPlayerState
    sounds: SoundPlayerState[]
    dialogue: DialoguePlayerState
    options: OptionPlayerState[]
    prompt: PromptPlayerState | null
}

export function getInitialGameSaveState(storyID: StoryID): GameSaveState {
    return {
        id: uncheckedRandID(),
        storyID,
        randState: randSeedRandom(),
        actions: [],
        stopAfter: null,
    }
}

export function getInitialScenePlayerState(settings: ScenePlayerSettingsState): ScenePlayerState {
    return { settings, characters: [], backdrops: [], song: { songID: null }, sounds: [], dialogue: { speakerID: null, speakerAlias: null, text: null, mode: 'adv' }, options: [], prompt: null }
}

export function prettyPrintActions(actions: AnyGamePlayerAction[]): string[] {
    const results: string[] = []
    for (let i = 0; i < actions.length; i++) {
        const action = throwIfNull(actions[i])
        switch (action.type) {
            case 'decision':
                results.push(`d:${String(action.index)}`)
                break
            case 'prompt':
                results.push(`p:${String(action.value)}`)
                break
            case 'randomize': {
                let count = 1
                while (actions[i + 1]?.type === 'randomize') {
                    i++
                    count++
                }
                results.push(`r:${String(count)}`)
                break
            }
        }
    }
    return results
}

export abstract class GamePlayerSignal extends Error {

}

export class StopGamePlayerSignal extends GamePlayerSignal {
    constructor(public step: AnyStep) { super(`Tried to stop at the current step but was unable to.\nStep: ${JSON.stringify(step)}`) }
}

export class ReturnToStepGamePlayerSignal extends GamePlayerSignal {
    constructor(public stepID: StepID) { super(`Tried to return to a previous step but was unable to.\nStep ID: ${stepID}`) }
}

export class GoToSceneGamePlayerSignal extends GamePlayerSignal {
    constructor(public sceneID: SceneID) { super(`Tried to go to a different scene but was unable to.\nScene ID: ${sceneID}`) }
}

export class StepErrorGamePlayerSignal extends GamePlayerSignal {
    constructor(public step: AnyStep, public ctx: ExprContext, cause: unknown) { super(`An error occurred while proccessing this step:\n${cause instanceof Error ? cause.message : String(cause)}\nStep: ${prettyPrintStep(step, ctx)}`, { cause }) }
}

export const parseAnyGameAction: ParseFunc<AnyGamePlayerAction> = defineParser<AnyGamePlayerAction>((c, v, d) => $.typed(c, v, {
    stepID: $.id,
}, {
    decision: {
        index: $.integer,
    },
    prompt: {
        //TODO: Allow parsing prompt values other than strings
        value: $.string as ParseFunc<unknown>,
    },
    randomize: {},
}, d))

export const parseSaveState: ParseFunc<GameSaveState> = defineParser<GameSaveState>((c, v, d) => $.object(c, v, {
    id: $.id,
    randState: (c, v, d) => $.tuple(c, v, hintTuple(defineParser<'xorshift32'>((c, v, d) => $.enum(c, v, ['xorshift32'], d)), $.integer), d),
    storyID: $.id,
    actions: (c, v, d) => $.array(c, v, parseAnyGameAction, d),
    stopAfter: (c, v, d) => $.either<StepID, null>(c, v, $.id, $.null, d),
}, d))

export const parseGameState: ParseFunc<GamePlayerState> = defineParser<GamePlayerState>((c, v, d) => $.object(c, v, {
    currentSave: (c, v, d) => $.either<GameSaveState, null>(c, v, parseSaveState, $.null, d),
}, d))
