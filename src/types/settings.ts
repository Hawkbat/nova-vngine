import { defineParser, type ParseFunc, parsers as $ } from '../utils/guard'
import type { ScenePlayerSettingsState } from './player'

export interface SettingsState {
    developerMode: boolean
    uiScale: number
    menuAnimationEnabled: boolean
    scenePlayerSettings: ScenePlayerSettingsState
}

export const parseSettingsState: ParseFunc<SettingsState> = defineParser<SettingsState>((c, v, d) => $.object(c, v, {
    developerMode: $.boolean,
    uiScale: $.number,
    menuAnimationEnabled: (c, v, d) => $.boolean(c, v, d ?? true),
    scenePlayerSettings: (c, v, d) => $.object(c, v, {
        musicVolume: $.number,
        soundVolume: $.number,
        uiVolume: $.number,
        textSpeed: $.number,
    }, { musicVolume: 1, soundVolume: 1, uiVolume: 1, textSpeed: 1 }),
}, d))
