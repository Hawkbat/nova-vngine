
import { openDialog, openPromptDialog } from '../components/common/Dialog'
import { platform } from '../platform/platform'
import { getStorageProvider } from '../storage/storage'
import { createDefaultProject, projectStore } from '../store/project'
import { viewStateStore } from '../store/viewstate'
import { createDefaultExpr, type ExprContext, resolveExpr } from '../types/expressions'
import { DEFAULT_PROJECT_FILENAME, isPlatformErrorCode, PlatformError } from '../types/platform'
import { type AnyEntity, type AnyVariableDefinition, type AnyVariableScope, type AssetDefinition, type BackdropDefinition, type BackdropID, type ChapterDefinition, type ChapterID, type CharacterDefinition, type CharacterID, type EntityIDOf, type EntityOfType, type EntityParentIDOf, type EntityParentOf, type EntityType, getEntityParentID, getEntityParentType, getEntityTypeByProjectKey, getProjectEntityKey, type MacroDefinition, type MacroID, parseProjectDefinition, type PortraitDefinition, type PortraitID, PROJECT_ENTITY_KEYS, type ProjectDefinition, type SceneDefinition, type SceneID, type SongDefinition, type SongID, type SoundDefinition, type SoundID, type StoryDefinition, type StoryID, type VariableID, type VariableType } from '../types/project'
import type { StorageRootEntry } from '../types/storage'
import type { ProjectMetaData } from '../types/viewstate'
import { arrayHead } from '../utils/array'
import { prettyPrintIdentifier } from '../utils/display'
import { existsFilter, throwIfNull, tryParseJson } from '../utils/guard'
import { immAppend, immSet } from '../utils/imm'
import { randFloat, randID, randInt, randSeedRandom, uncheckedRandID } from '../utils/rand'
import { assertExhaustive, hintTuple } from '../utils/types'

export function parseProjectFromJson(text: string) {
    const parsed = tryParseJson(text, 'project', parseProjectDefinition)
    if (parsed.ctx.warnings.length) void platform.warn(parsed.ctx.warnings)
    if (!parsed.success) {
        void platform.error('Failed to parse project', text, parsed.ctx.errors)
        throw new PlatformError('bad-project', `The project file was outdated or corrupted in a manner that has prevented it from loading.\n\n${parsed.ctx.errors.join('\n')}`)
    }
    return parsed.value
}

export async function saveProject(root: StorageRootEntry, project: ProjectDefinition) {
    const json = JSON.stringify(project, undefined, 2)
    const provider = getStorageProvider(root.type)
    if (!provider.storeText) throw new PlatformError('not-supported', 'Tried to save project file but current storage provider does not support it')
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

export async function tryLoadProject(root: StorageRootEntry) {
    try {
        await loadProject(root)
        viewStateStore.setValue(s => immSet(s, 'currentTab', 'project'))
    } catch (err) {
        if (isPlatformErrorCode(err, 'bad-project')) {
            await openDialog('Bad Project File', err.message, { ok: 'OK' })
            return false
        }
        throw err
    }
    return true
}

export async function userCreateNewProject() {
    if (projectStore.isDirty()) {
        const result = await openDialog('Unsaved Changes', 'You have unsaved changes. Are you sure you want to discard these changes and start a new project?', { cancel: 'Cancel', continue: 'Continue' })
        if (result === 'cancel') return
    }

    const storage = getStorageProvider()

    if (!storage.pickDirectory) {
        if (storage.createLocalRoot) {
            const id = uncheckedRandID()
            const root = await storage.createLocalRoot(id)
            if (!root) {
                await openDialog('Not Supported', 'Failed to create new project.', { ok: 'OK' })
                return
            }
            const initialProject = createDefaultProject(id)
            await saveProject(root, initialProject)
            await tryLoadProject(root)
            return
        }
        await openDialog('Not Supported', 'Your operating system or browser does not support saving new projects. A project could not be created.', { ok: 'OK' })
        return
    }

    const dirResult = await storage.pickDirectory(null, { title: 'Select project folder' })
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

    if (!storage.pickDirectory) {
        await openDialog('Not Supported', 'Your operating system or browser does not support opening projects.', { ok: 'OK' })
        return
    }

    const dirResult = await storage.pickDirectory(null, { title: 'Select project folder' })
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

export async function userSelectProjectByUrl() {
    const url = await openPromptDialog('Input Project URL', 'Specify a full URL to a project folder hosted on a public web server. The URL must begin with "https://" and not have a trailing forward slash.', 'Project URL', '', 'Load Project')
    if (!url) return
    const root: StorageRootEntry = { type: 'fetch', key: url }
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
        },
        variables: {
            getValue: id => resolveExpr(project.variables.find(e => e.id === id)?.default ?? createDefaultExpr('unset', ctx), ctx),
            setValue: () => {},
            getCharacterValue: (id, characterID) => resolveExpr(project.variables.find(e => e.id === id)?.default ?? createDefaultExpr('unset', ctx), ctx),
            setCharacterValue: () => {},
        },
        random: {
            float: (min, max) => randFloat(randSeedRandom(), min, max)[1],
            int: (min, max) => randInt(randSeedRandom(), min, max)[1],
        },
        scope: {

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

export function getEntityAssets(type: EntityType, entity: AnyEntity): AssetDefinition[] {
    switch (type) {
        case 'portrait': return [(entity as PortraitDefinition).image].filter(existsFilter)
        case 'backdrop': return [(entity as BackdropDefinition).image].filter(existsFilter)
        case 'song': return [(entity as SongDefinition).audio].filter(existsFilter)
        case 'sound': return [(entity as SoundDefinition).audio].filter(existsFilter)
        default: return []
    }
}

export function getEntityPrimaryAsset<T extends EntityType>(type: T, entity: EntityOfType<T>): AssetDefinition | null {
    switch (type) {
        case 'portrait': return (entity as PortraitDefinition).image
        case 'backdrop': return (entity as BackdropDefinition).image
        case 'character': {
            const portraits = projectStore.getSnapshot().portraits.filter(p => p.characterID === entity.id)
            const portrait = portraits.find(p => (entity as CharacterDefinition).mainPortraitID === p.id) ?? arrayHead(portraits)
            return portrait?.image ?? null
        }
        default: return null
    }
}

export function getEntityDisplayName<T extends EntityType>(type: T, entity: EntityOfType<T> | null | undefined, includeParent: boolean): string {
    if (!entity) return 'None'
    const entityName = entity.name ? entity.name : `Untitled ${prettyPrintIdentifier(type)}`
    const parentType = getEntityParentType(type)
    const parent = getEntityParent(type, entity)
    if (includeParent && parentType && parent) return `${getEntityDisplayName(parentType, parent, false)} - ${entityName}`
    if (type === 'variable' && includeParent) {
        const [parentType, parent] = getVariableParent(entity as AnyVariableDefinition)
        if (parentType && parent) return `${getEntityDisplayName(parentType, parent, false)} - ${entityName}`
    }
    return entityName
}

export function getEntityDisplayNameByID<T extends EntityType>(type: T, id: EntityIDOf<T> | null | undefined, includeParent: boolean): string {
    return getEntityDisplayName(type, id ? getEntityByID(type, id) : null, includeParent)
}

export function getEntityEditorDisplayName<T extends EntityType>(type: T, entity: EntityOfType<T> | null | undefined): string {
    if (!entity) return getEntityDisplayName(type, entity, false)
    if (type === 'variable') {
        const [parentType, parent] = getVariableParent(entity as AnyVariableDefinition)
        const includeParent = parentType && parent ? viewStateStore.getValue().scopes[parentType] !== parent.id : true
        return getEntityDisplayName(type, entity, includeParent)
    }
    const parentType = getEntityParentType(type)
    const parent = getEntityParent(type, entity)
    const includeParent = parentType && parent ? viewStateStore.getValue().scopes[parentType] !== parent.id : true
    return getEntityDisplayName(type, entity, includeParent)
}

export function getEntityEditorDisplayNameByID<T extends EntityType>(type: T, id: EntityIDOf<T> | null | undefined): string {
    return getEntityEditorDisplayName(type, id ? getEntityByID(type, id) : null)
}

export function getVariableParent(v: AnyVariableDefinition): [EntityType | null, AnyEntity | null] {
    switch (v.scope.type) {
        case 'story': return hintTuple('story', getEntityByID('story', v.scope.value))
        case 'chapter': return hintTuple('chapter', getEntityByID('chapter', v.scope.value))
        case 'scene': return hintTuple('scene', getEntityByID('scene', v.scope.value))
        case 'character': return hintTuple('character', getEntityByID('character', v.scope.value))
        case 'macro': return hintTuple('macro', getEntityByID('macro', v.scope.value))
        default: return [null, null]
    }
}

export function getEntityReferences(id: string): { type: EntityType, id: string }[] {
    const existsInTree = (v: unknown): boolean => {
        if (typeof v === 'string') return v === id
        else if (typeof v !== 'object') return false
        else if (v === null) return false
        else if (Array.isArray(v)) {
            if (v.length && v.some(e => existsInTree(e))) return true
        } else {
            for (const k of Object.keys(v)) {
                if (existsInTree(k)) return true
            }
            for (const e of Object.values(v)) {
                if (existsInTree(e)) return true
            }
        }
        return false
    }

    return PROJECT_ENTITY_KEYS.flatMap(k => projectStore.getSnapshot()[k].filter(e => e.id !== id).flatMap(e => existsInTree(e) ? [{ type: throwIfNull(getEntityTypeByProjectKey(k)), id: e.id }] : []))
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
        firstChapterID: null,
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
        firstSceneID: null,
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
        mainPortraitID: null,
        alias: { type: 'unset' },
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
        height: 'auto',
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

export function immCreateVariable(project: ProjectDefinition, scope?: AnyVariableScope): [ProjectDefinition, AnyVariableDefinition] {
    let id: VariableID;
    [project, id] = immGenerateID(project)

    const ctx = getProjectExprContext()

    const variable: AnyVariableDefinition = {
        id,
        name: '',
        type: 'flag',
        scope: scope ?? { type: 'allStories' },
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
        inputs: [],
        outputs: [],
    }

    return hintTuple(immSet(project, 'macros', immAppend(project.macros, macro)), macro)
}

export function immCreateEntity<T extends EntityType>(type: T, project: ProjectDefinition, parentID?: EntityParentIDOf<T> | null): [ProjectDefinition, EntityOfType<T>] {
    switch (type) {
        case 'story': return immCreateStory(project) as [ProjectDefinition, EntityOfType<T>]
        case 'chapter': return immCreateChapter(project, throwIfNull(parentID) as StoryID) as [ProjectDefinition, EntityOfType<T>]
        case 'scene': return immCreateScene(project, throwIfNull(parentID) as ChapterID) as [ProjectDefinition, EntityOfType<T>]
        case 'character': return immCreateCharacter(project) as [ProjectDefinition, EntityOfType<T>]
        case 'portrait': return immCreatePortrait(project, throwIfNull(parentID) as CharacterID) as [ProjectDefinition, EntityOfType<T>]
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
