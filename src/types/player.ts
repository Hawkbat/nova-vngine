import { throwIfNull } from '../utils/guard'
import { immAppend, immPrepend, immReplaceWhere, immSet } from '../utils/imm'
import { assertExhaustive } from '../utils/types'
import { type ExprContext, type ExprValueType, isPrimitiveValue, type LocationValue, resolveExprAs } from './expressions'
import { type BackdropID, type CharacterID, getVariableValueType, type PortraitID, type SongID, type SoundID } from './project'
import type { AnyStep } from './steps'

export interface CharacterPlayerState {
    characterID: CharacterID
    portraitID: PortraitID
    location: LocationValue
}

export interface BackdropPlayerState {
    backdropID: BackdropID
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
    prompts: PromptPlayerState[]
}

export function getInitialRenderSceneState(): ScenePlayerState {
    return { settings: { musicVolume: 1, soundVolume: 1, uiVolume: 1, textSpeed: 1 }, characters: [], backdrops: [], song: { songID: null }, sounds: [], dialogue: { speakerID: null, speakerAlias: null, text: null, mode: 'adv' }, options: [], prompts: [] }
}

export function applyStepToRenderSceneState(state: ScenePlayerState, step: AnyStep, ctx: ExprContext): ScenePlayerState {
    state = immSet(state, 'options', [])
    if (step.type !== 'sound') state = immSet(state, 'sounds', [])
    if (step.type !== 'prompt') state = immSet(state, 'prompts', [])
    switch (step.type) {
        case 'backdrop': {
            const backdropID = resolveExprAs(step.backdrop, 'backdrop', ctx).value
            switch (step.mode) {
                case 'replace': return immSet(state, 'backdrops', [{ backdropID }])
                case 'append': return immSet(state, 'backdrops', immAppend(state.backdrops, { backdropID }))
                case 'prepend': return immSet(state, 'backdrops', immPrepend(state.backdrops, { backdropID }))
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
            return immSet(state, 'characters', immReplaceWhere(state.characters, s => s.characterID === characterID, c => immSet(c, 'location', resolveExprAs(step.location, 'location', ctx).value)))
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
        case 'decision': return immSet(state, 'options', step.options.map(o => ({ enabled: resolveExprAs(o.condition, 'boolean', ctx).value, text: resolveExprAs(o.text, 'string', ctx).value })))
        case 'prompt': {
            const label = step.label
            const variableID = resolveExprAs(step.variable, 'variable', ctx).value
            const variable = throwIfNull(ctx.resolvers.variable(variableID))
            const type = getVariableValueType(variable, ctx)
            const exprValue = resolveExprAs(step.initialValue, type, ctx)
            const initialValue = isPrimitiveValue(exprValue) ? exprValue.value : exprValue.values.map(v => v.value)
            return immSet(state, 'prompts', immAppend(state.prompts, { label, type, initialValue }))
        }
        default: return state
    }
}
