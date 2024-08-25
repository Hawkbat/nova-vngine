import { ProjectDefinition } from "../../types/definitions"
import styles from './ProjectEditor.module.css'
import { EditorIcon } from "../common/EditorIcon"
import { COMMON_ICONS, EXPR_VALUE_ICONS, PROJECT_TAB_ICONS } from "../common/Icons"
import { prettyPrintIdentifier } from "../../utils/display"
import { ProjectWorkspace } from "../workspaces/ProjectWorkspace"
import { SceneWorkspace } from "../workspaces/SceneWorkspace"
import { HomeWorkspace } from "../workspaces/HomeWorkspace"
import { projectStore } from "../../store/project"
import { useViewStateTab, ViewState, viewStateStore } from "../../store/viewstate"
import { useStore, useSelector } from "../../utils/store"
import { StoryWorkspace } from "../workspaces/StoryWorkspace"
import { immSet } from "../../utils/imm"
import { ChapterWorkspace } from "../workspaces/ChapterWorkspace"
import { EditorButton, EditorButtonGroup } from "../common/EditorButton"
import { platform } from "../../utils/platform/platform"

export type ProjectEditorTab = 'home' | 'manual' | 'settings' | 'project' | Exclude<keyof ProjectDefinition, 'id' | 'name' | 'editorRandState'>

const PROJECT_TABS: ProjectEditorTab[] = [
    'project',
    'stories',
    'chapters',
    'scenes',
    'characters',
    'portraits',
    'backdrops',
    'songs',
    'sounds',
    'variables',
]

const Breadcrumb = <T extends keyof ViewState['scopes']>({ name, tab, scope }: { name: string | undefined, tab: ProjectEditorTab, scope: T }) => {
    const [, setCurrentTab] = useViewStateTab()
    if (name === undefined) return
    if (!name) name = `Untitled ${prettyPrintIdentifier(scope)}`

    return <EditorButton icon={EXPR_VALUE_ICONS[scope]} style='outline' onClick={() => setCurrentTab(tab)}>
        <span>{name}</span>
        <EditorIcon path={COMMON_ICONS.cancel} label={`Stop Filtering By ${prettyPrintIdentifier(scope)}`} onClick={() => viewStateStore.setValue(s => immSet(s, 'scopes', immSet(s.scopes, scope, undefined)))} />
    </EditorButton>
}

const Breadcrumbs = ({} : {}) => {
    const [project] = useStore(projectStore)
    const [projectIsLoaded] = useSelector(viewStateStore, s => s.loadedProject !== null)
    const [scopes] = useSelector(viewStateStore, s => s.scopes)
    return projectIsLoaded ? <div className={styles.breadcrumbs}>
        {Object.values(scopes).filter(s => s && s.length).length ? <span className={styles.breadcrumbLabel}>Filtering by:</span> : null}
        {scopes.story ? <Breadcrumb scope='story' tab='stories' name={project.stories.find(o => o.id === scopes.story)?.name} /> : null}
        {scopes.chapter ? <Breadcrumb scope='chapter' tab='chapters' name={project.chapters.find(o => o.id === scopes.chapter)?.name} /> : null}
        {scopes.scene ? <Breadcrumb scope='scene' tab='scenes' name={project.scenes.find(o => o.id === scopes.scene)?.name} /> : null}
        {scopes.character ? <Breadcrumb scope='character' tab='characters' name={project.characters.find(o => o.id === scopes.character)?.name} /> : null}
        {scopes.portrait ? <Breadcrumb scope='portrait' tab='portraits' name={project.portraits.find(o => o.id === scopes.portrait)?.name} /> : null}
        {scopes.backdrop ? <Breadcrumb scope='backdrop' tab='backdrops' name={project.backdrops.find(o => o.id === scopes.backdrop)?.name} /> : null}
        {scopes.song ? <Breadcrumb scope='song' tab='songs' name={project.songs.find(o => o.id === scopes.song)?.name} /> : null}
        {scopes.sound ? <Breadcrumb scope='sound' tab='sounds' name={project.sounds.find(o => o.id === scopes.sound)?.name} /> : null}
        {scopes.variable ? <Breadcrumb scope='variable' tab='variables' name={project.variables.find(o => o.id === scopes.variable)?.name} /> : null}
    </div> : null
}

const TabButton = ({ tab }: { tab: ProjectEditorTab }) => {
    const [currentTab, setCurrentTab] = useViewStateTab()
    return <EditorIcon path={PROJECT_TAB_ICONS[tab]} label={prettyPrintIdentifier(tab)} active={currentTab === tab} showLabel onClick={() => setCurrentTab(tab)} />
}

const Sidebar = ({ }: { }) => {
    const [projectIsLoaded] = useSelector(viewStateStore, s => s.loadedProject !== null)

    return <div className={styles.sidebar}>
        <TabButton tab='home' />
        <div className={styles.sidebarSpacer} />
        {projectIsLoaded ? <>
            {PROJECT_TABS.map(t => <TabButton key={t} tab={t} />)}
            <div className={styles.sidebarSpacer} />
        </> : null}
        <TabButton tab='manual' />
        <TabButton tab='settings' />
    </div>
}

const Footer = ({ }: { }) => {
    const [loadedProject] = useSelector(viewStateStore, s => s.loadedProject)
    return loadedProject ? <div className={styles.footer}>
        <EditorButtonGroup>
            <EditorButton onClick={() => platform.saveProject(loadedProject.directory, projectStore.getSnapshot())}>Save Project</EditorButton>
        </EditorButtonGroup>
    </div> : null
}

export const ProjectEditor = ({ }: { }) => {
    const [currentTab] = useSelector(viewStateStore, s => s.currentTab)
    
    return <div className={styles.editor}>
        <Sidebar />
        <div className={styles.pane}>
            <Breadcrumbs />
            <div className={styles.workspace}>
                {currentTab === 'home' ? <HomeWorkspace /> : null}
                {currentTab === 'project' ? <ProjectWorkspace /> : null}
                {currentTab === 'stories' ? <StoryWorkspace /> : null}
                {currentTab === 'chapters' ? <ChapterWorkspace /> : null}
                {currentTab === 'scenes' ? <SceneWorkspace /> : null}
            </div>
            <Footer />
        </div>
    </div>
}
