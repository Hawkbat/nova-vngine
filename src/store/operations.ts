import { useCallback } from 'react'

import { openDialog } from '../components/common/Dialog'
import { platform } from '../platform/platform'
import { getStorageProvider } from '../platform/storage/storage'
import { createDefaultExpr, type ExprContext, resolveExpr } from '../types/expressions'
import { DEFAULT_PROJECT_FILENAME, isPlatformErrorCode, PlatformError } from '../types/platform'
import { type AnyVariableDefinition, type BackdropDefinition, type BackdropID, type ChapterDefinition, type ChapterID, type CharacterDefinition, type CharacterID, ENTITY_TYPES, type EntityIDOf, type EntityOfType, type EntityParentIDOf, type EntityParentOf, type EntityType, getEntityParentID, getEntityParentType, getEntityTypeHierarchy, getProjectEntityKey, type MacroDefinition, type MacroID, parseProjectDefinition, type PortraitDefinition, type PortraitID, type ProjectDefinition, type SceneDefinition, type SceneID, type SongDefinition, type SongID, type SoundDefinition, type SoundID, type StoryDefinition, type StoryID, type VariableID, type VariableType } from '../types/project'
import type { StorageRootEntry } from '../types/storage'
import type { ProjectEditorTab, ProjectMetaData } from '../types/viewstate'
import { tryParseJson } from '../utils/guard'
import { immAppend, immSet } from '../utils/imm'
import { randID, uncheckedRandID } from '../utils/rand'
import { useSelector } from '../utils/store'
import { assertExhaustive, hintTuple } from '../utils/types'
import { createDefaultProject, projectStore } from './project'
import { settingsStore } from './settings'
import { viewStateStore } from './viewstate'

function parseProjectFromJson(text: string) {
    const parsed = tryParseJson(text, 'project', parseProjectDefinition)
    if (parsed.ctx.warnings.length) void platform.warn(parsed.ctx.warnings)
    if (!parsed.success) {
        void platform.error('Failed to parse project', text, parsed.ctx.errors)
        throw new PlatformError('bad-project', 'The project file was outdated or corrupted in a manner that has prevented it from loading.')
    }
    return parsed.value
}

export async function saveProject(root: StorageRootEntry, project: ProjectDefinition) {
    const json = JSON.stringify(project, undefined, 2)
    const provider = getStorageProvider(root.type)
    if (!provider.storeText) throw new PlatformError('bad-project', 'Tried to save project file but current storage provider does not support it')
    await provider.storeText(root, DEFAULT_PROJECT_FILENAME, json)
}

export async function loadProject(root: StorageRootEntry) {
    const json = await getStorageProvider(root.type).loadText(root, DEFAULT_PROJECT_FILENAME)
    const project = parseProjectFromJson(json)

    const projectMetaData: ProjectMetaData = { id: project.id, name: project.name, root: root }

    viewStateStore.setValue(viewState => ({
        ...viewState,
        loadedProject: projectMetaData,
        recentProjects: viewState.recentProjects.filter(p => p.id !== projectMetaData.id).concat([projectMetaData]),
    }))
    projectStore.setValue(() => project)
    projectStore.clearHistory()
    projectStore.setDirty(false)
    return true
}

export async function loadInitialViewState() {
    const viewState = await platform.loadViewState()
    viewStateStore.setValue(() => viewState)
    try {
        if (viewState.loadedProject && await loadProject(viewState.loadedProject.root)) {
            return
        }
    } catch (err) {
        if (isPlatformErrorCode(err, 'bad-project')) {
            void platform.error('Failed to load previously loaded project', err)
        } else {
            throw err
        }
    }
    viewStateStore.setValue(s => ({
        ...s,
        currentTab: 'home',
        loadedProject: null,
        loaded: true,
    }))
}

export async function loadInitialSettings() {
    const viewState = await platform.loadSettings()
    settingsStore.setValue(() => viewState)
}

async function tryLoadProject(root: StorageRootEntry) {
    try {
        await loadProject(root)
        viewStateStore.setValue(s => immSet(s, 'currentTab', 'project'))
    } catch (err) {
        if (isPlatformErrorCode(err, 'bad-project')) {
            await openDialog('Bad Project File', err.message, { ok: 'OK' })
            return false
        }
    }
    return true
}

export async function userCreateNewProject() {
    if (projectStore.isDirty()) {
        const result = await openDialog('Unsaved Changes', 'You have unsaved changes. Are you sure you want to discard these changes and start a new project?', { cancel: 'Cancel', continue: 'Continue' })
        if (result === 'cancel') return
    }

    const storage = getStorageProvider()

    const dirResult = await storage.pickDirectory?.(null, { title: 'Select project folder' })
    if (!dirResult) return

    const root = await dirResult.toRoot()
    const entries = await storage.listDirectory(root, '.')

    const projectFileEntry = entries.files.find(e => e.name === DEFAULT_PROJECT_FILENAME)
    if (projectFileEntry) {
        const result = await openDialog('Folder Not Empty', 'The folder you selected contains an existing project, so a new project cannot be created there. Would you like to open the project you selected instead?', { cancel: 'Cancel', continue: 'Open Project' })
        if (result === 'cancel') return
        await tryLoadProject(root)
        return
    }

    if (entries.files.length || entries.directories.length) {
        await openDialog('Folder Not Empty', 'The folder you selected contains files or folders already and cannot be used for new projects. Please select an empty folder.', { ok: 'OK' })
        return
    }

    const id = root.type === 'browser' || root.type === 'chromium' ? root.key : uncheckedRandID()
    const initialProject = createDefaultProject(id)
    await saveProject(root, initialProject)
    await tryLoadProject(root)
}

export async function userSelectProject() {
    if (projectStore.isDirty()) {
        const result = await openDialog('Unsaved Changes', 'You have unsaved changes. Are you sure you want to discard these changes and open a different project?', { cancel: 'Cancel', continue: 'Continue' })
        if (result === 'cancel') return
    }

    const storage = getStorageProvider()

    const dirResult = await storage.pickDirectory?.(null, { title: 'Select project folder' })
    if (!dirResult) return

    const root = await dirResult.toRoot()
    const entries = await storage.listDirectory(root, '.')

    const projectFile = entries.files.find(f => f.name === DEFAULT_PROJECT_FILENAME)
    if (!projectFile) {
        await openDialog('Invalid Project', 'The folder you selected does not contain a valid project file. Please select a directory containing a valid project.', { ok: 'OK' })
        return
    }

    await tryLoadProject(root)
}

export async function userOpenRecentProject(p: ProjectMetaData) {
    await tryLoadProject(p.root)
}

export function getProjectExprContext(): ExprContext {
    const project = projectStore.getSnapshot()
    const scopes = viewStateStore.getSnapshot().scopes

    const getSuggestions = <T extends EntityType>(type: T): EntityIDOf<T>[] => {
        const projectKey = getProjectEntityKey(type)
        const values = project[projectKey]
        return values.sort((a, b) => {
            if (a.id === scopes[type]) return -1
            if (b.id === scopes[type]) return 1
            return 0
        }).map(v => v.id) as EntityIDOf<T>[]
    }

    const ctx: ExprContext = {
        suggestions: {
            story: () => getSuggestions('story'),
            chapter: () => getSuggestions('chapter'),
            scene: () => getSuggestions('scene'),
            character: () => getSuggestions('character'),
            portrait: () => getSuggestions('portrait'),
            backdrop: () => getSuggestions('backdrop'),
            song: () => getSuggestions('song'),
            sound: () => getSuggestions('sound'),
            macro: () => getSuggestions('macro'),
            variable: () => getSuggestions('variable'),
        },
        resolvers: {
            story: id => project.stories.find(e => e.id === id) ?? null,
            chapter: id => project.chapters.find(e => e.id === id) ?? null,
            scene: id => project.scenes.find(e => e.id === id) ?? null,
            character: id => project.characters.find(e => e.id === id) ?? null,
            portrait: id => project.portraits.find(e => e.id === id) ?? null,
            backdrop: id => project.backdrops.find(e => e.id === id) ?? null,
            song: id => project.songs.find(e => e.id === id) ?? null,
            sound: id => project.sounds.find(e => e.id === id) ?? null,
            macro: id => project.macros.find(e => e.id === id) ?? null,
            variable: id => project.variables.find(e => e.id === id) ?? null,
            variableValue: id => resolveExpr(project.variables.find(e => e.id === id)?.default ?? createDefaultExpr('unset', ctx), ctx),
        },
    }
    return ctx
}

export type EntityPair<T extends EntityType> = { type: T, entity: EntityOfType<T> }

export function getEntityHierarchy<T extends EntityType>(type: T, id: EntityIDOf<T>): EntityPair<EntityType>[] {
    const entity = getEntityByID(type, id)
    if (!entity) return []
    const parentType = getEntityParentType(type)
    const parentID = getEntityParentID(type, entity)
    if (parentType && parentID) return [...getEntityHierarchy(parentType, parentID), { type, entity }]
    return [{ type, entity }]
}

export function getEntityParent<T extends EntityType>(type: T, entity: EntityOfType<T>): EntityOfType<EntityParentOf<T>> | null {
    const parentType = getEntityParentType(type)
    if (!parentType) return null
    const parentID = getEntityParentID(type, entity)
    if (!parentID) return null
    const parent = getEntityByID(parentType, parentID)
    if (!parent) return null
    return parent
}

export function getEntityByID<T extends EntityType>(type: T, id: EntityIDOf<T>): EntityOfType<T> | null {
    const project = projectStore.getSnapshot()
    const key = getProjectEntityKey(type)
    const entities = project[key]
    const entity = entities.find(e => e.id === id)
    if (entity) return entity as EntityOfType<T>
    return null
}

export function immGenerateID<T extends string>(project: ProjectDefinition): [ProjectDefinition, T] {
    const [editorRandState, id] = randID(project.editorRandState)
    return hintTuple(immSet(project, 'editorRandState', editorRandState), id as T)
}

export function immCreateStory(project: ProjectDefinition): [ProjectDefinition, StoryDefinition] {
    let id: StoryID;
    [project, id] = immGenerateID(project)

    const story: StoryDefinition = {
        id,
        name: '',
    }

    return hintTuple(immSet(project, 'stories', immAppend(project.stories, story)), story)
}

export function immCreateChapter(project: ProjectDefinition, storyID: StoryID): [ProjectDefinition, ChapterDefinition] {
    let id: ChapterID;
    [project, id] = immGenerateID(project)

    const chapter: ChapterDefinition = {
        id,
        name: '',
        storyID,
    }

    return hintTuple(immSet(project, 'chapters', immAppend(project.chapters, chapter)), chapter)
}

export function immCreateScene(project: ProjectDefinition, chapterID: ChapterID): [ProjectDefinition, SceneDefinition] {
    let id: SceneID;
    [project, id] = immGenerateID(project)

    const scene: SceneDefinition = {
        id,
        name: '',
        chapterID,
        steps: [],
    }

    return hintTuple(immSet(project, 'scenes', immAppend(project.scenes, scene)), scene)
}

export function immCreateCharacter(project: ProjectDefinition): [ProjectDefinition, CharacterDefinition] {
    let id: CharacterID;
    [project, id] = immGenerateID(project)

    const character: CharacterDefinition = {
        id,
        name: '',
    }

    return hintTuple(immSet(project, 'characters', immAppend(project.characters, character)), character)
}

export function immCreatePortrait(project: ProjectDefinition, characterID: CharacterID): [ProjectDefinition, PortraitDefinition] {
    let id: PortraitID;
    [project, id] = immGenerateID(project)

    const portrait: PortraitDefinition = {
        id,
        name: '',
        characterID,
        image: null,
    }

    return hintTuple(immSet(project, 'portraits', immAppend(project.portraits, portrait)), portrait)
}

export function immCreateBackdrop(project: ProjectDefinition): [ProjectDefinition, BackdropDefinition] {
    let id: BackdropID;
    [project, id] = immGenerateID(project)

    const backdrop: BackdropDefinition = {
        id,
        name: '',
        image: null,
    }

    return hintTuple(immSet(project, 'backdrops', immAppend(project.backdrops, backdrop)), backdrop)
}

export function immCreateSong(project: ProjectDefinition): [ProjectDefinition, SongDefinition] {
    let id: SongID;
    [project, id] = immGenerateID(project)

    const song: SongDefinition = {
        id,
        name: '',
        audio: null,
    }

    return hintTuple(immSet(project, 'songs', immAppend(project.songs, song)), song)
}

export function immCreateSound(project: ProjectDefinition): [ProjectDefinition, SoundDefinition] {
    let id: SoundID;
    [project, id] = immGenerateID(project)

    const sound: SoundDefinition = {
        id,
        name: '',
        audio: null,
    }

    return hintTuple(immSet(project, 'sounds', immAppend(project.sounds, sound)), sound)
}

export function immCreateVariable(project: ProjectDefinition): [ProjectDefinition, AnyVariableDefinition] {
    let id: VariableID;
    [project, id] = immGenerateID(project)

    const ctx = getProjectExprContext()

    const variable: AnyVariableDefinition = {
        id,
        name: '',
        type: 'flag',
        scope: { type: 'allStories' },
        default: createDefaultExpr('boolean', ctx),
        setValueLabel: createDefaultExpr('unset', ctx),
        unsetValueLabel: createDefaultExpr('unset', ctx),
    }

    return hintTuple(immSet(project, 'variables', immAppend(project.variables, variable)), variable)
}

export function immCreateMacro(project: ProjectDefinition): [ProjectDefinition, MacroDefinition] {
    let id: MacroID;
    [project, id] = immGenerateID(project)

    const macro: MacroDefinition = {
        id,
        name: '',
        steps: [],
    }

    return hintTuple(immSet(project, 'macros', immAppend(project.macros, macro)), macro)
}

export function immCreateEntity<T extends EntityType>(type: T, project: ProjectDefinition, parentID: EntityParentIDOf<T>): [ProjectDefinition, EntityOfType<T>] {
    switch (type) {
        case 'story': return immCreateStory(project) as [ProjectDefinition, EntityOfType<T>]
        case 'chapter': return immCreateChapter(project, parentID as StoryID) as [ProjectDefinition, EntityOfType<T>]
        case 'scene': return immCreateScene(project, parentID as ChapterID) as [ProjectDefinition, EntityOfType<T>]
        case 'character': return immCreateCharacter(project) as [ProjectDefinition, EntityOfType<T>]
        case 'portrait': return immCreatePortrait(project, parentID as CharacterID) as [ProjectDefinition, EntityOfType<T>]
        case 'backdrop': return immCreateBackdrop(project) as [ProjectDefinition, EntityOfType<T>]
        case 'song': return immCreateSong(project) as [ProjectDefinition, EntityOfType<T>]
        case 'sound': return immCreateSound(project) as [ProjectDefinition, EntityOfType<T>]
        case 'variable': return immCreateVariable(project) as [ProjectDefinition, EntityOfType<T>]
        case 'macro': return immCreateMacro(project) as [ProjectDefinition, EntityOfType<T>]
        default: assertExhaustive(type, `Unhandled entity type ${type}`)
    }
}

export function immConvertVariable(variable: AnyVariableDefinition, type: VariableType): AnyVariableDefinition {
    const ctx = getProjectExprContext()
    const { id, name, scope } = variable
    switch (type) {
        case 'flag': return { id, name, type, scope, default: createDefaultExpr('boolean', ctx), setValueLabel: createDefaultExpr('string', ctx), unsetValueLabel: createDefaultExpr('string', ctx) }
        case 'integer': return { id, name, type, scope, default: createDefaultExpr('integer', ctx) }
        case 'number': return { id, name, type, scope, default: createDefaultExpr('number', ctx) }
        case 'text': return { id, name, type, scope, default: createDefaultExpr('string', ctx) }
        case 'singleChoice': return { id, name, type, scope, default: createDefaultExpr('unset', ctx), options: createDefaultExpr('list', ctx) }
        case 'multipleChoice': return { id, name, type, scope, default: createDefaultExpr('list', ctx), options: createDefaultExpr('list', ctx) }
        case 'chapter': return { id, name, type, scope, default: createDefaultExpr('chapter', ctx) }
        case 'scene': return { id, name, type, scope, default: createDefaultExpr('scene', ctx) }
        case 'character': return { id, name, type, scope, default: createDefaultExpr('character', ctx) }
        case 'portrait': return { id, name, type, scope, default: createDefaultExpr('portrait', ctx) }
        case 'list': return { id, name, type, scope, elements: { type: 'flag', setValueLabel: createDefaultExpr('string', ctx), unsetValueLabel: createDefaultExpr('string', ctx) }, default: createDefaultExpr('list', ctx) }
        case 'lookup': return { id, name, type, scope, keys: { type: 'flag', setValueLabel: createDefaultExpr('string', ctx), unsetValueLabel: createDefaultExpr('string', ctx) }, elements: { type: 'flag', setValueLabel: createDefaultExpr('string', ctx), unsetValueLabel: createDefaultExpr('string', ctx) }, default: createDefaultExpr('unset', ctx) }
        default: assertExhaustive(type, `Unhandled variable type ${String(type)}`)
    }
}

export function useViewStateTab() {
    const getTab = useSelector(viewStateStore, s => s.currentTab)
    const setTab = useCallback((tab: ProjectEditorTab) => {
        viewStateStore.setValue(s => immSet(s, 'currentTab', tab))
    }, [])
    return hintTuple(getTab, setTab)
}

export function useViewStateScope<T extends EntityType>(type: T | null): [() => EntityIDOf<T> | null, (id: EntityIDOf<T> | null) => void] {
    const getScopes = useSelector(viewStateStore, s => s.scopes)
    const getScope = useCallback(() => type ? getScopes()[type] as EntityIDOf<T> | null : null, [getScopes, type])
    const setScope = useCallback((id: EntityIDOf<T> | null) => {
        if (!type) return
        if (!id) {
            const subTypes = ENTITY_TYPES.filter(e => getEntityTypeHierarchy(e).includes(type))
            const scopeValues = Object.fromEntries(subTypes.map(t => hintTuple(t, null)))
            viewStateStore.setValue(s => ({ ...s, scopes: { ...s.scopes, ...scopeValues } }))
            return
        }
        const hierarchy = getEntityHierarchy(type, id)
        const scopeValues = Object.fromEntries(hierarchy.map(h => hintTuple(h.type, h.entity.id)))
        viewStateStore.setValue(s => ({ ...s, scopes: { ...s.scopes, ...scopeValues } }))
    }, [type])
    return hintTuple(getScope, setScope)
}

export function getProjectStorage() {
    const root = viewStateStore.getSnapshot().loadedProject?.root ?? null
    const storage = getStorageProvider(root?.type)
    return { storage, root }
}

export function useProjectStorage() {
    const getRoot = useSelector(viewStateStore, s => s.loadedProject?.root ?? null)
    const storage = getStorageProvider(getRoot()?.type)
    return { storage, getRoot }
}
