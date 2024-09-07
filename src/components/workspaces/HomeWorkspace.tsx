import faviconSvgUrl from '../../favicon.svg'
import { userCreateNewProject, userOpenRecentProject, userSelectProject, userSelectProjectByUrl } from '../../operations/project'
import { useViewStateTab } from '../../operations/viewState'
import { getStorageProvider } from '../../storage/storage'
import { settingsStore } from '../../store/settings'
import { viewStateStore } from '../../store/viewstate'
import type { ProjectMetaData } from '../../types/viewstate'
import { useSelector } from '../../utils/store'
import { EditorButton } from '../common/EditorButton'
import { EditorIcon } from '../common/EditorIcon'
import { COMMON_ICONS, PROJECT_TAB_ICONS } from '../common/Icons'

import styles from './HomeWorkspace.module.css'

const ProjectItem = ({ project }: { project: ProjectMetaData }) => {
    const getDeveloperMode = useSelector(settingsStore, s => s.developerMode)
    const getLoadedProject = useSelector(viewStateStore, s => s.loadedProject)

    const onClick = () => {
        void userOpenRecentProject(project)
    }

    const storage = getStorageProvider(project.root.type)
    const isLoaded = getLoadedProject()?.id === project.id
    const isSupported = storage.isSupported()

    return <EditorButton style='outline' icon={PROJECT_TAB_ICONS['project']} active={isLoaded} disabled={!isSupported} onClick={onClick}>
            <div className={styles.projectRows}>
                <label className={styles.projectName}>{project.name ? project.name : 'Untitled Project'}</label>
                <div className={styles.projectInfo}>
                    <span>Storage: {storage.name}</span>
                    {getDeveloperMode() ? <span>ID: {project.id}</span> : null}
                </div>
            </div>
        </EditorButton>
}

export const HomeWorkspace = () => {
    const [, setCurrentTab] = useViewStateTab()
    const getRecentProjects = useSelector(viewStateStore, s => s.recentProjects)
    const storage = getStorageProvider()
    const supportsNew = storage.createLocalRoot || storage.pickDirectory ? true : false
    const supportsOpen = storage.pickDirectory ? true : false
    const supportsOpenUrl = getStorageProvider('fetch').isSupported()

    return <div className={styles.workspace}>
        <div className={styles.logo}>
            <img src={faviconSvgUrl} />
            Nova VNgine
        </div>
        <div className={styles.buttonGroup}>
            {supportsNew ? <EditorIcon label='New Local Project' path={COMMON_ICONS.newProject} showLabel onClick={() => void userCreateNewProject()} /> : null}
            {supportsOpen ? <EditorIcon label='Open Local Project' path={COMMON_ICONS.openProject} showLabel onClick={() => void userSelectProject()} /> : null}
            {supportsOpenUrl ? <EditorIcon label='Open Project By URL' path={COMMON_ICONS.openProjectUrl} showLabel onClick={() => void userSelectProjectByUrl()} /> : null}
            <EditorIcon label='Help Manual' path={PROJECT_TAB_ICONS['manual']} showLabel onClick={() => setCurrentTab('manual')} />
            <EditorIcon label='Edit Settings' path={PROJECT_TAB_ICONS['settings']} showLabel onClick={() => setCurrentTab('settings')} />
        </div>
        {getRecentProjects().length ? <>
            <span className={styles.heading}>Recent Projects</span>
            <div className={styles.projects}>
                {getRecentProjects().toReversed().map(p => <ProjectItem key={p.id} project={p} />)}
            </div>
        </> : null}
    </div>
}
