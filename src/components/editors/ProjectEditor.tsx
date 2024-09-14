import { useCallback } from 'react'

import { BUILD_COMMIT, BUILD_DATETIME } from '../../injected'
import { getEntityDisplayName } from '../../operations/project'
import { useViewStateScope, useViewStateTab } from '../../operations/viewState'
import { platform } from '../../platform/platform'
import { getStorageProvider } from '../../storage/storage'
import { projectStore } from '../../store/project'
import { viewStateStore } from '../../store/viewstate'
import type { EntityType } from '../../types/project'
import { ENTITY_TYPES, getEntityTypeByProjectKey, getEntityTypeHierarchy, getProjectEntityKey, isProjectEntityKey, PROJECT_ENTITY_KEYS } from '../../types/project'
import type { ProjectEditorTab } from '../../types/viewstate'
import { prettyPrintIdentifier } from '../../utils/display'
import { useSelector } from '../../utils/store'
import { EditorButton } from '../common/EditorButton'
import { EditorIcon } from '../common/EditorIcon'
import { COMMON_ICONS, EXPR_VALUE_ICONS, PROJECT_TAB_ICONS } from '../common/Icons'
import { GamePlayer } from '../player/GamePlayer'
import { BackdropWorkspace } from '../workspaces/BackdropWorkspace'
import { ChapterWorkspace } from '../workspaces/ChapterWorkspace'
import { CharacterWorkspace } from '../workspaces/CharacterWorkspace'
import { HomeWorkspace } from '../workspaces/HomeWorkspace'
import { MacroWorkspace } from '../workspaces/MacroWorkspace'
import { ManualWorkspace } from '../workspaces/ManualWorkspace'
import { PortraitWorkspace } from '../workspaces/PortraitWorkspace'
import { ProjectWorkspace } from '../workspaces/ProjectWorkspace'
import { SceneWorkspace } from '../workspaces/SceneWorkspace'
import { SettingsWorkspace } from '../workspaces/SettingsWorkspace'
import { SongWorkspace } from '../workspaces/SongWorkspace'
import { SoundWorkspace } from '../workspaces/SoundWorkspace'
import { StoryWorkspace } from '../workspaces/StoryWorkspace'
import { VariableWorkspace } from '../workspaces/VariableWorkspace'

import styles from './ProjectEditor.module.css'

const Breadcrumb = ({ type }: { type: EntityType }) => {
    const tab = getProjectEntityKey(type)
    const [getScope, setScope] = useViewStateScope(type)
    const getEntity = useSelector(projectStore, s => s[tab].find(i => i.id === getScope()) ?? null)
    const [getCurrentTab, setCurrentTab] = useViewStateTab()
    const entity = getEntity()
    if (entity === null) return
    const entityType = getEntityTypeByProjectKey(getCurrentTab())
    if (!isProjectEntityKey(getCurrentTab()) || !entityType || !getEntityTypeHierarchy(entityType).includes(type)) return

    return <>
        <EditorIcon path={COMMON_ICONS.breadcrumbArrow} />
        <EditorButton icon={EXPR_VALUE_ICONS[type]} style='text' active={getCurrentTab() === tab} onClick={() => setCurrentTab(tab)}>
            <span>{getEntityDisplayName(type, entity, false)}</span>
            <EditorIcon path={COMMON_ICONS.cancel} label={`Stop Filtering By ${prettyPrintIdentifier(type)}`} onClick={() => setScope(null)} />
        </EditorButton>
    </>
}

const Breadcrumbs = () => {
    const getProjectName = useSelector(projectStore, s => s.name)
    const getProjectIsLoaded = useSelector(viewStateStore, s => s.loadedProject !== null)
    const [getCurrentTab, setCurrentTab] = useViewStateTab()
    return getProjectIsLoaded() && getCurrentTab() !== 'play' ? <div className={styles.breadcrumbs}>
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
    const [getCurrentTab] = useViewStateTab()
    const getProjectIsLoaded = useSelector(viewStateStore, s => s.loadedProject !== null)
    const getInGame = useSelector(viewStateStore, s => s.editor?.type === 'game' && s.editor.menu === 'play')

    return !getInGame() ? <div className={styles.sidebar}>
        <TabButton tab='home' />
        {getProjectIsLoaded() ? <>
            <TabButton tab='play' />
            <div className={styles.sidebarLine} />
            <TabButton tab='project' />
            {getCurrentTab() === 'project' || (PROJECT_ENTITY_KEYS as string[]).includes(getCurrentTab()) ? PROJECT_ENTITY_KEYS.map(t => <TabButton key={t} tab={t} />) : null}
        </> : null}
        <div className={styles.sidebarSpacer} />
        <div className={styles.sidebarLine} />
        <TabButton tab='manual' />
        <TabButton tab='settings' />
    </div> : null
}

const Footer = () => {
    const getProjectStorageType = useSelector(viewStateStore, s => s.loadedProject?.root.type)
    return <div className={styles.footer}>
        <span>Platform: {platform.name}</span>
        <span>Storage: {getStorageProvider(getProjectStorageType()).name}</span>
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
                {getCurrentTab() === 'play' ? <GamePlayer /> : null}
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
                {getCurrentTab() === 'macros' ? <MacroWorkspace /> : null}
                {getCurrentTab() === 'manual' ? <ManualWorkspace /> : null}
                {getCurrentTab() === 'settings' ? <SettingsWorkspace /> : null}
            </div>
            <Footer />
        </div>
    </div>
}
