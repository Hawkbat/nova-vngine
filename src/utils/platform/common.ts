import type { ViewState } from "../../store/viewstate"
import type { ProjectDefinition } from "../../types/definitions"

export interface PlatformFilesystemEntry {
    path: string
    name: string
    handle: unknown
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
}

export type PlatformErrorCode = 'not-supported' | 'bad-project'

export class PlatformError extends Error {
    readonly code: PlatformErrorCode

    constructor(code: PlatformErrorCode, message: string) {
        super(message)
        this.code = code
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
