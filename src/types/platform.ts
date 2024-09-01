import type { PlatformType } from '../platform/platform'
import type { SettingsState } from './settings'
import type { ViewState } from './viewstate'

export interface Platform {
    type: PlatformType
    name: string
    isSupported(): boolean
    initialize(): Promise<void>
    loadViewState(): Promise<ViewState>
    saveViewState(viewState: ViewState): Promise<void>
    loadSettings(): Promise<SettingsState>
    saveSettings(settings: SettingsState): Promise<void>
    setTitle(title: string): Promise<void>
    log(...objs: unknown[]): Promise<void>
    warn(...objs: unknown[]): Promise<void>
    error(...objs: unknown[]): Promise<void>
}

export type PlatformErrorCode = 'not-supported' | 'bad-project' | 'bad-asset'

export class PlatformError extends Error {
    readonly code: PlatformErrorCode
    override readonly message: string

    constructor(code: PlatformErrorCode, message: string) {
        super(message)
        this.code = code
        this.message = message
        this.name = this.constructor.name
    }
}

export function isPlatformErrorCode(err: unknown, code: PlatformErrorCode): err is PlatformError {
    return err instanceof PlatformError && err.code === code
}

export const PROJECT_FILE_EXT = 'nvnproject.json'
export const DEFAULT_PROJECT_FILENAME = `main.${PROJECT_FILE_EXT}`
