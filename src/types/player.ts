import { immAppend, immReplaceWhere, immSet, immSetProps } from '../utils/imm'
import { resolveExprAs, type ExprContext, type LocationValue } from './expressions'
import type { CharacterID, PortraitID, BackdropID, SongID, SoundID } from './project'
import type { AnyStep } from './steps'

export interface CharacterPlayerState {
    characterID: CharacterID
    portraitID: PortraitID
    location: LocationValue
}

export interface BackdropPlayerState {
    backdropID: BackdropID | null
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
}

export interface OptionPlayerState {
    enabled: boolean
    text: string
}

export interface ScenePlayerSettingsState {
    musicVolume: number
    soundVolume: number
    uiVolume: number
}

export interface ScenePlayerState {
    settings: ScenePlayerSettingsState
    characters: CharacterPlayerState[]
    backdrop: BackdropPlayerState
    song: SongPlayerState
    sounds: SoundPlayerState[]
    dialogue: DialoguePlayerState
    options: OptionPlayerState[]
}

export function getInitialRenderSceneState(): ScenePlayerState {
    return { settings: { musicVolume: 1, soundVolume: 1, uiVolume: 1 }, characters: [], backdrop: { backdropID: null }, song: { songID: null }, sounds: [], dialogue: { speakerID: null, speakerAlias: null, text: null }, options: [] }
}

export function applyStepToRenderSceneState(state: ScenePlayerState, step: AnyStep, ctx: ExprContext): ScenePlayerState {
    state = immSetProps(state, {
        sounds: [],
        options: [],
    })
    switch (step.type) {
        case 'backdrop': return immSet(state, 'backdrop', immSet(state.backdrop, 'backdropID', resolveExprAs(step.backdrop, 'backdrop', ctx).value))
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
        })
        case 'decision': return immSet(state, 'options', step.options.map(o => ({ enabled: resolveExprAs(o.condition, 'boolean', ctx).value, text: resolveExprAs(o.text, 'string', ctx).value })))
        default: return state
    }
}
