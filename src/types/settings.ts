import { defineParser, parsers as $, type ParseFunc } from '../utils/guard'

export interface SettingsState {
    developerMode: boolean
}

export const parseSettingsState: ParseFunc<SettingsState> = defineParser<SettingsState>((c, v, d) => $.object(c, v, {
    developerMode: $.boolean,
}, d))
