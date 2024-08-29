import type { ViewState } from './viewstate'
import type { ProjectDefinition } from './definitions'
import type { ParseFunc } from '../utils/guard'
import { defineParser, parsers as $ } from '../utils/guard'

export interface PlatformFilesystemEntry {
    path: string
    name: string
    handle: string
}

export interface Platform {
    name: string
    initialize(): Promise<void>
    loadViewState(): Promise<ViewState>
    saveViewState(viewState: ViewState): Promise<void>
    loadProject(dir: PlatformFilesystemEntry): Promise<ProjectDefinition | null>
    saveProject(dir: PlatformFilesystemEntry, project: ProjectDefinition): Promise<void>
    createProject(dir: PlatformFilesystemEntry): Promise<ProjectDefinition>
    setTitle(title: string): Promise<void>
    pickFiles(title: string, fileType: string, extensions: string[], multi: boolean): Promise<PlatformFilesystemEntry[] | null>
    pickDirectory(title: string): Promise<{ directory: PlatformFilesystemEntry, files: PlatformFilesystemEntry[], directories: PlatformFilesystemEntry[] } | null>
    log(...objs: unknown[]): Promise<void>
    warn(...objs: unknown[]): Promise<void>
    error(...objs: unknown[]): Promise<void>
}

export type PlatformErrorCode = 'not-supported' | 'bad-project'

export class PlatformError extends Error {
    readonly code: PlatformErrorCode
    readonly message: string

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

export const isProjectFile = (file: PlatformFilesystemEntry): boolean => {
    return file.name.toLowerCase().endsWith(PROJECT_FILE_EXT)
}

export const parsePlatformFilesystemEntry: ParseFunc<PlatformFilesystemEntry> = defineParser<PlatformFilesystemEntry>((c, v, d) => $.object(c, v, {
    path: $.string,
    name: $.string,
    handle: $.string,
}, d))
