import type { EntityType } from '../../types/project'
import { ENTITY_TYPES, getEntityTypeByProjectKey, getEntityTypeHierarchy, getProjectEntityKey, isProjectEntityKey, PROJECT_ENTITY_KEYS } from '../../types/project'
import styles from './ProjectEditor.module.css'
import { EditorIcon } from '../common/EditorIcon'
import { COMMON_ICONS, EXPR_VALUE_ICONS, PROJECT_TAB_ICONS } from '../common/Icons'
import { prettyPrintIdentifier } from '../../utils/display'
import { ProjectWorkspace } from '../workspaces/ProjectWorkspace'
import { SceneWorkspace } from '../workspaces/SceneWorkspace'
import { HomeWorkspace } from '../workspaces/HomeWorkspace'
import { projectStore } from '../../store/project'
import { viewStateStore } from '../../store/viewstate'
import { useViewStateScope, useViewStateTab } from '../../store/operations'
import { useSelector } from '../../utils/store'
import { StoryWorkspace } from '../workspaces/StoryWorkspace'
import { ChapterWorkspace } from '../workspaces/ChapterWorkspace'
import { EditorButton } from '../common/EditorButton'
import { CharacterWorkspace } from '../workspaces/CharacterWorkspace'
import { PortraitWorkspace } from '../workspaces/PortraitWorkspace'
import { BackdropWorkspace } from '../workspaces/BackdropWorkspace'
import { SongWorkspace } from '../workspaces/SongWorkspace'
import { SoundWorkspace } from '../workspaces/SoundWorkspace'
import { VariableWorkspace } from '../workspaces/VariableWorkspace'
import { platform } from '../../platform/platform'
import { BUILD_COMMIT, BUILD_DATETIME } from '../../injected'
import type { ProjectEditorTab } from '../../types/viewstate'
import { useCallback } from 'react'
import { SettingsWorkspace } from '../workspaces/SettingsWorkspace'

const Breadcrumb = ({ type }: { type: EntityType }) => {
    const tab = getProjectEntityKey(type)
    const [getScope, setScope] = useViewStateScope(type)
    const getName = useSelector(projectStore, s => s[tab].find(i => i.id === getScope())?.name ?? null)
    const [getCurrentTab, setCurrentTab] = useViewStateTab()
    if (getName() === null) return
    const entityType = getEntityTypeByProjectKey(getCurrentTab())
    if (!isProjectEntityKey(getCurrentTab()) || !entityType || !getEntityTypeHierarchy(entityType).includes(type)) return

    return <>
        <EditorIcon path={COMMON_ICONS.breadcrumbArrow} />
        <EditorButton icon={EXPR_VALUE_ICONS[type]} style='text' active={getCurrentTab() === tab} onClick={() => setCurrentTab(tab)}>
            <span>{getName() ? getName() : `Untitled ${prettyPrintIdentifier(type)}`}</span>
            <EditorIcon path={COMMON_ICONS.cancel} label={`Stop Filtering By ${prettyPrintIdentifier(type)}`} onClick={() => setScope(null)} />
        </EditorButton>
    </>
}

const Breadcrumbs = () => {
    const getProjectName = useSelector(projectStore, s => s.name)
    const getProjectIsLoaded = useSelector(viewStateStore, s => s.loadedProject !== null)
    const [getCurrentTab, setCurrentTab] = useViewStateTab()
    return getProjectIsLoaded() ? <div className={styles.breadcrumbs}>
        <EditorButton icon={PROJECT_TAB_ICONS.project} style='text' active={getCurrentTab() === 'project'} onClick={() => setCurrentTab('project')}>{getProjectName()}</EditorButton>
        {ENTITY_TYPES.map(e => <Breadcrumb key={e} type={e} />)}
    </div> : null
}

const TabButton = ({ tab }: { tab: ProjectEditorTab }) => {
    const [getCurrentTab, setCurrentTab] = useViewStateTab()
    const entityType = getEntityTypeByProjectKey(tab)
    const [, setScope] = useViewStateScope(entityType)
    const onClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        if (getCurrentTab() === tab) {
            if (entityType) {
                setScope(null)
            }
        } else {
            setCurrentTab(tab)
        }
    }, [entityType, getCurrentTab, setCurrentTab, setScope, tab])
    return <EditorIcon path={PROJECT_TAB_ICONS[tab]} label={prettyPrintIdentifier(tab)} active={getCurrentTab() === tab} showLabel onClick={onClick} />
}

const Sidebar = () => {
    const getProjectIsLoaded = useSelector(viewStateStore, s => s.loadedProject !== null)

    return <div className={styles.sidebar}>
        <TabButton tab='home' />
        {getProjectIsLoaded() ? <>
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
    return <div className={styles.footer}>
        <span>Platform: {platform.name}</span>
        <span>Build: {BUILD_COMMIT.BRANCH}/{BUILD_COMMIT.SHORT_HASH} at {BUILD_DATETIME.toISOString()}</span>
    </div>
}

export const ProjectEditor = () => {
    const getCurrentTab = useSelector(viewStateStore, s => s.currentTab)

    return <div className={styles.editor}>
        <Sidebar />
        <div className={styles.pane}>
            <Breadcrumbs />
            <div className={styles.workspace}>
                {getCurrentTab() === 'home' ? <HomeWorkspace /> : null}
                {getCurrentTab() === 'project' ? <ProjectWorkspace /> : null}
                {getCurrentTab() === 'stories' ? <StoryWorkspace /> : null}
                {getCurrentTab() === 'chapters' ? <ChapterWorkspace /> : null}
                {getCurrentTab() === 'scenes' ? <SceneWorkspace /> : null}
                {getCurrentTab() === 'characters' ? <CharacterWorkspace /> : null}
                {getCurrentTab() === 'portraits' ? <PortraitWorkspace /> : null}
                {getCurrentTab() === 'backdrops' ? <BackdropWorkspace /> : null}
                {getCurrentTab() === 'songs' ? <SongWorkspace /> : null}
                {getCurrentTab() === 'sounds' ? <SoundWorkspace /> : null}
                {getCurrentTab() === 'variables' ? <VariableWorkspace /> : null}
                {getCurrentTab() === 'settings' ? <SettingsWorkspace /> : null}
            </div>
            <Footer />
        </div>
    </div>
}
