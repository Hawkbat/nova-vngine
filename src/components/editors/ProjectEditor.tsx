import { ENTITY_TYPES, EntityType, getEntityTypeByProjectKey, getEntityTypeHierarchy, getProjectEntityKey, isProjectEntityKey, PROJECT_ENTITY_KEYS, ProjectEntityKeyOf } from "../../types/definitions"
import styles from './ProjectEditor.module.css'
import { EditorIcon } from "../common/EditorIcon"
import { COMMON_ICONS, EXPR_VALUE_ICONS, PROJECT_TAB_ICONS } from "../common/Icons"
import { prettyPrintIdentifier } from "../../utils/display"
import { ProjectWorkspace } from "../workspaces/ProjectWorkspace"
import { SceneWorkspace } from "../workspaces/SceneWorkspace"
import { HomeWorkspace } from "../workspaces/HomeWorkspace"
import { projectStore } from "../../store/project"
import { useViewStateScope, useViewStateTab, viewStateStore } from "../../store/viewstate"
import { useSelector } from "../../utils/store"
import { StoryWorkspace } from "../workspaces/StoryWorkspace"
import { ChapterWorkspace } from "../workspaces/ChapterWorkspace"
import { EditorButton } from "../common/EditorButton"
import { CharacterWorkspace } from "../workspaces/CharacterWorkspace"
import { PortraitWorkspace } from "../workspaces/PortraitWorkspace"
import { BackdropWorkspace } from "../workspaces/BackdropWorkspace"
import { SongWorkspace } from "../workspaces/SongWorkspace"
import { SoundWorkspace } from "../workspaces/SoundWorkspace"
import { VariableWorkspace } from "../workspaces/VariableWorkspace"

export type ProjectEditorTab = 'home' | 'manual' | 'settings' | 'project' | ProjectEntityKeyOf<EntityType>

const Breadcrumb = <T extends EntityType>({ type }: { type: T }) => {
    const tab = getProjectEntityKey(type)
    const [scope, setScope] = useViewStateScope(type)
    const [name] = useSelector(projectStore, s => s[tab].find(i => i.id === scope)?.name)
    const [currentTab, setCurrentTab] = useViewStateTab()
    if (name === undefined) return
    if (!isProjectEntityKey(currentTab) || !getEntityTypeHierarchy(getEntityTypeByProjectKey(currentTab)).includes(type)) return

    return <>
        <EditorIcon path={COMMON_ICONS.breadcrumbArrow} />
        <EditorButton icon={EXPR_VALUE_ICONS[type]} style='outline' onClick={() => setCurrentTab(tab)}>
            <span>{name ? name : `Untitled ${prettyPrintIdentifier(type)}`}</span>
            <EditorIcon path={COMMON_ICONS.cancel} label={`Stop Filtering By ${prettyPrintIdentifier(type)}`} onClick={() => setScope(undefined)} />
        </EditorButton>
    </>
}

const Breadcrumbs = ({} : {}) => {
    const [projectName] = useSelector(projectStore, s => s.name)
    const [projectIsLoaded] = useSelector(viewStateStore, s => s.loadedProject !== null)
    const [, setCurrentTab] = useViewStateTab()
    return projectIsLoaded ? <div className={styles.breadcrumbs}>
        <EditorButton icon={PROJECT_TAB_ICONS.project} style='outline' onClick={() => setCurrentTab('project')}>{projectName}</EditorButton>
        {ENTITY_TYPES.map(e => <Breadcrumb key={e} type={e} />)}
    </div> : null
}

const TabButton = ({ tab }: { tab: ProjectEditorTab }) => {
    const [currentTab, setCurrentTab] = useViewStateTab()
    return <EditorIcon path={PROJECT_TAB_ICONS[tab]} label={prettyPrintIdentifier(tab)} active={currentTab === tab} showLabel onClick={() => setCurrentTab(tab)} />
}

const Sidebar = () => {
    const [projectIsLoaded] = useSelector(viewStateStore, s => s.loadedProject !== null)

    return <div className={styles.sidebar}>
        <TabButton tab='home' />
        {projectIsLoaded ? <>
            <div className={styles.sidebarLine} />
            <TabButton tab='project' />
            {PROJECT_ENTITY_KEYS.map(t => <TabButton key={t} tab={t} />)}
        </> : null}
        <div className={styles.sidebarSpacer} />
        <div className={styles.sidebarLine} />
        <TabButton tab='manual' />
        <TabButton tab='settings' />
    </div>
}

const Footer = () => {
    const [loadedProject] = useSelector(viewStateStore, s => s.loadedProject)
    return loadedProject ? <div className={styles.footer}>
        
    </div> : null
}

export const ProjectEditor = () => {
    const [currentTab] = useSelector(viewStateStore, s => s.currentTab)
    
    return <div className={styles.editor}>
        <Sidebar />
        <div className={styles.pane}>
            {currentTab !== 'home' ? <Breadcrumbs /> : null}
            <div className={styles.workspace}>
                {currentTab === 'home' ? <HomeWorkspace /> : null}
                {currentTab === 'project' ? <ProjectWorkspace /> : null}
                {currentTab === 'stories' ? <StoryWorkspace /> : null}
                {currentTab === 'chapters' ? <ChapterWorkspace /> : null}
                {currentTab === 'scenes' ? <SceneWorkspace /> : null}
                {currentTab === 'characters' ? <CharacterWorkspace /> : null}
                {currentTab === 'portraits' ? <PortraitWorkspace /> : null}
                {currentTab === 'backdrops' ? <BackdropWorkspace /> : null}
                {currentTab === 'songs' ? <SongWorkspace /> : null}
                {currentTab === 'sounds' ? <SoundWorkspace /> : null}
                {currentTab === 'variables' ? <VariableWorkspace /> : null}
            </div>
            <Footer />
        </div>
    </div>
}
