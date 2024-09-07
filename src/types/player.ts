import { getEntityDisplayName, getProjectExprContext } from '../operations/project'
import { arrayTail } from '../utils/array'
import { throwIfNull } from '../utils/guard'
import { immAppend, immPrepend, immReplaceWhere, immSet } from '../utils/imm'
import { randFloat, randInt, randSeedRandom, type RandState, uncheckedRandID } from '../utils/rand'
import { assertExhaustive } from '../utils/types'
import { type AnyExprValue, castExprValue, type ExprContext, type ExprValueType, isPrimitiveValue, type LocationValue, resolveExpr, resolveExprAs } from './expressions'
import { type AnyVariableDefinition, type AnyVariableScope, type BackdropID, type ChapterID, type CharacterID, getVariableValueType, type MacroID, type PortraitID, type SceneID, type SongID, type SoundID, type StoryID, type VariableID } from './project'
import type { AnyStep, StepID } from './steps'

interface GamePlayerAction<T extends string> {
    type: T
}

export interface GamePlayerActionPrompt extends GamePlayerAction<'prompt'> {
    stepID: StepID
    value: unknown
}

export interface GamePlayerActionDecision extends GamePlayerAction<'decision'> {
    stepID: StepID
    index: number
}

export type AnyGamePlayerAction =
    | GamePlayerActionPrompt
    | GamePlayerActionDecision

export type GamePlayerActionType = AnyGamePlayerAction['type']

export type GamePlayerActionOfType<T extends GamePlayerActionType> = Extract<AnyGamePlayerAction, { type: T }>

interface MacroPlayerEvalState {
    id: MacroID
    variables: Record<VariableID, AnyExprValue>
}

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

export interface GamePlayerEvalState {
    randState: RandState
    story: {
        id: StoryID
        variables: Record<VariableID, AnyExprValue>
        chapter: {
            id: ChapterID
            variables: Record<VariableID, AnyExprValue>
            scene: {
                id: SceneID
                variables: Record<VariableID, AnyExprValue>
            } | null
        } | null
        characters: Record<CharacterID, {
            variables: Record<VariableID, AnyExprValue>
        }>
    } | null
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
    mode: 'adv' | 'nvl'
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

export function applyStepToScenePlayerState(state: ScenePlayerState, step: AnyStep, ctx: ExprContext): ScenePlayerState {
    state = immSet(state, 'options', [])
    if (step.type !== 'sound') state = immSet(state, 'sounds', [])
    if (step.type !== 'prompt') state = immSet(state, 'prompt', null)
    switch (step.type) {
        case 'backdrop': {
            const backdropID = resolveExprAs(step.backdrop, 'backdrop', ctx).value
            switch (step.mode) {
                case 'replace': return immSet(state, 'backdrops', [{ backdropID, dir: 0 }])
                case 'append': return immSet(state, 'backdrops', immAppend(state.backdrops, { backdropID, dir: 1 as const }))
                case 'prepend': return immSet(state, 'backdrops', immPrepend(state.backdrops, { backdropID, dir: -1 as const }))
                default: assertExhaustive(step, `Unhandled backdrop mode ${JSON.stringify(step)}`)
            }
            break
        }
        case 'music': return immSet(state, 'song', immSet(state.song, 'songID', resolveExprAs(step.song, 'song', ctx).value))
        case 'enter': return immSet(state, 'characters', immAppend(state.characters, {
            characterID: resolveExprAs(step.character, 'character', ctx).value,
            portraitID: resolveExprAs(step.portrait, 'portrait', ctx).value,
            location: resolveExprAs(step.location, 'location', ctx).value,
        }))
        case 'portrait': {
            const characterID = resolveExprAs(step.character, 'character', ctx).value
            return immSet(state, 'characters', immReplaceWhere(state.characters, s => s.characterID === characterID, c => immSet(c, 'portraitID', resolveExprAs(step.portrait, 'portrait', ctx).value)))
        }
        case 'move': {
            const characterID = resolveExprAs(step.character, 'character', ctx).value
            const location = resolveExprAs(step.location, 'location', ctx).value
            return immSet(state, 'characters', immReplaceWhere(state.characters, s => s.characterID === characterID, c => immSet(c, 'location', {
                position: location.position === 'auto' ? c.location.position : location.position,
                height: location.height === 'auto' ? c.location.height : location.height,
                scale: location.scale === 'auto' ? c.location.scale : location.scale,
            })))
        }
        case 'exit': {
            const characterID = resolveExprAs(step.character, 'character', ctx).value
            return immSet(state, 'characters', state.characters.filter(c => c.characterID !== characterID))
        }
        case 'sound': return immSet(state, 'sounds', immAppend(state.sounds, { soundID: resolveExprAs(step.sound, 'sound', ctx).value }))
        case 'text': return immSet(state, 'dialogue', {
                speakerID: resolveExprAs(step.speaker, 'character', ctx).value,
                speakerAlias: state.dialogue.speakerAlias,
                text: resolveExprAs(step.text, 'string', ctx).value,
                mode: 'adv',
        })
        case 'narrate': return immSet(state, 'dialogue', {
                speakerID: null,
                speakerAlias: null,
                text: resolveExprAs(step.text, 'string', ctx).value,
                mode: step.mode,
        })
        case 'decision': return immSet(state, 'options', step.options.map((o, index) => ({ index, enabled: resolveExprAs(o.condition, 'boolean', ctx).value, text: resolveExprAs(o.text, 'string', ctx).value })))
        case 'prompt': {
            const label = step.label
            const variableID = resolveExprAs(step.variable, 'variable', ctx).value
            const variable = throwIfNull(ctx.resolvers.variable(variableID))
            const type = getVariableValueType(variable, ctx)
            const exprValue = resolveExprAs(step.initialValue, type, ctx)
            const initialValue = isPrimitiveValue(exprValue) ? exprValue.value : exprValue.values.map(v => v.value)
            return immSet(state, 'prompt', { label, type, initialValue })
        }
        default: return state
    }
}

function isVariableInScope(evalState: GamePlayerEvalState, variable: AnyVariableDefinition, characterID: CharacterID | null, macroID: MacroID | null): boolean {
    switch (variable.scope.type) {
        case 'allStories': return !!evalState.story
        case 'stories': return !!evalState.story && variable.scope.value.includes(evalState.story.id)
        case 'story': return !!evalState.story && variable.scope.value === evalState.story.id
        case 'allChapters': return !!evalState.story?.chapter
        case 'chapters': return !!evalState.story?.chapter && variable.scope.value.includes(evalState.story.chapter.id)
        case 'chapter': return !!evalState.story?.chapter && variable.scope.value === evalState.story.chapter.id
        case 'allScenes': return !!evalState.story?.chapter?.scene
        case 'scenes': return !!evalState.story?.chapter?.scene && variable.scope.value.includes(evalState.story.chapter.scene.id)
        case 'scene': return !!evalState.story?.chapter?.scene && variable.scope.value === evalState.story.chapter.scene.id
        case 'allCharacters': return !!characterID
        case 'characters': return !!characterID && variable.scope.value.includes(characterID)
        case 'character': return !!characterID && variable.scope.value === characterID
        case 'allMacros': return !!macroID
        case 'macros': return !!macroID && variable.scope.value.includes(macroID)
        case 'macro': return !!macroID && variable.scope.value === macroID
    }
}

function getVariableTarget(evalState: GamePlayerEvalState, scope: AnyVariableScope, characterID: CharacterID | null, macroID: MacroID | null) {
    switch (scope.type) {
        case 'allStories':
        case 'stories':
        case 'story':
            return throwIfNull(evalState.story?.variables)
        case 'allChapters':
        case 'chapters':
        case 'chapter':
            return throwIfNull(evalState.story?.chapter?.variables)
        case 'allScenes':
        case 'scenes':
        case 'scene':
            return throwIfNull(evalState.story?.chapter?.scene?.variables)
        case 'allCharacters':
        case 'characters':
        case 'character': {
            const story = throwIfNull(evalState.story)
            const charID = throwIfNull(characterID)
            const character = story.characters[charID] ?? { variables: {} }
            story.characters[charID] = character
            return character.variables
        }
        case 'allMacros':
        case 'macros':
        case 'macro': {
            const macro = throwIfNull(arrayTail(evalState.macros))
            if (macro.id !== macroID) throw new Error('Tried to get or set variable in a different macro')
            return macro.variables
        }
        default: assertExhaustive(scope, `Unimplemented variable scope type ${JSON.stringify(scope)}`)
    }
}

function getVariable(evalState: GamePlayerEvalState, variableID: VariableID, characterID: CharacterID | null, macroID: MacroID | null, exprContext: ExprContext) {
    const variable = throwIfNull(exprContext.resolvers.variable(variableID))
    if (!isVariableInScope(evalState, variable, characterID, macroID)) throw new Error(`Tried to get a value for ${getEntityDisplayName('variable', variable, false)} but it was not in scope`)
    const variableTarget = getVariableTarget(evalState, variable.scope, characterID, macroID)
    return variableTarget[variableID] ?? resolveExpr(variable.default, exprContext)
}

function setVariable(evalState: GamePlayerEvalState, variableID: VariableID, value: AnyExprValue, characterID: CharacterID | null, macroID: MacroID | null, exprContext: ExprContext) {
    const variable = throwIfNull(exprContext.resolvers.variable(variableID))
    if (!isVariableInScope(evalState, variable, characterID, macroID)) throw new Error(`Tried to set a value for ${getEntityDisplayName('variable', variable, false)} but it was not in scope`)
    const variableType = getVariableValueType(variable, exprContext)
    const convertedValue = castExprValue(value, variableType, exprContext)
    const variableTarget = getVariableTarget(evalState, variable.scope, characterID, macroID)
    variableTarget[variableID] = convertedValue
}

export function getExprContext(getState: () => GamePlayerEvalState, setState: (setter: (state: GamePlayerEvalState) => GamePlayerEvalState) => void): ExprContext {
    const projectCtx = getProjectExprContext()

    const ctx: ExprContext = {
        ...projectCtx,
        variables: {
            getValue: (id) => getVariable(getState(), id, null, null, ctx),
            setValue: (id, value) => setVariable(getState(), id, value, null, null, ctx),
            getCharacterValue: (id, characterID) => getVariable(getState(), id, characterID, null, ctx),
            setCharacterValue: (id, characterID, value) => setVariable(getState(), id, value, characterID, null, ctx),
            getMacroValue: (id, macroID) => getVariable(getState(), id, null, macroID, ctx),
            setMacroValue: (id, macroID, value) => setVariable(getState(), id, value, null, macroID, ctx),
        },
        random: {
            float(min, max) {
                const result = randFloat(getState().randState, min, max)
                setState(s => immSet(s, 'randState', result[0]))
                return result[1]
            },
            int(min, max) {
                const result = randInt(getState().randState, min, max)
                setState(s => immSet(s, 'randState', result[0]))
                return result[1]
            },
        },
    }
    return ctx
}

export class StopGamePlayerSignal extends Error {
    constructor(public step: AnyStep) { super(`Tried to stop at the current step but was unable to. Step: ${JSON.stringify(step)}`) }
}

export class ReturnToStepGamePlayerSignal extends Error {
    constructor(public stepID: StepID) { super(`Tried to return to a previous step but was unable to. Step ID: ${stepID}`) }
}

export class GoToSceneGamePlayerSignal extends Error {
    constructor(public sceneID: SceneID) { super(`Tried to go to a different scene but was unable to. Scene ID: ${sceneID}`) }
}
