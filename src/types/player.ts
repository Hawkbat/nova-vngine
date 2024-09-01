import { immAppend, immReplaceWhere, immSet } from '../utils/imm'
import { resolveExprAs, type ExprContext, type LocationValue } from './expressions'
import type { CharacterID, PortraitID, BackdropID, SongID, SoundID } from './project'
import type { AnyStep } from './steps'

export interface RenderCharacterState {
    characterID: CharacterID
    portraitID: PortraitID
    location: LocationValue
}

export interface RenderBackdropState {
    backdropID: BackdropID | null
}

export interface RenderSongState {
    songID: SongID | null
}

export interface RenderSoundState {
    soundID: SoundID
}

export interface RenderDialogueState {
    speakerID: CharacterID | null
    speakerAlias: string | null
    text: string | null
}

export interface RenderSceneState {
    characters: RenderCharacterState[]
    backdrop: RenderBackdropState
    song: RenderSongState
    sounds: RenderSoundState[]
    dialogue: RenderDialogueState
}

export function getInitialRenderSceneState(): RenderSceneState {
    return { characters: [], backdrop: { backdropID: null }, song: { songID: null }, sounds: [], dialogue: { speakerID: null, speakerAlias: null, text: null } }
}

export function applyStepToRenderSceneState(state: RenderSceneState, step: AnyStep, ctx: ExprContext): RenderSceneState {
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
            return immSet(state, 'characters', state.characters.filter(c => c.characterID === characterID))
        }
        case 'sound': return immSet(state, 'sounds', immAppend(state.sounds, { soundID: resolveExprAs(step.sound, 'sound', ctx).value }))
        case 'text': return immSet(state, 'dialogue', {
            speakerID: resolveExprAs(step.speaker, 'character', ctx).value,
            speakerAlias: state.dialogue.speakerAlias,
            text: resolveExprAs(step.text, 'string', ctx).value,
        })
        default: return state
    }
}
