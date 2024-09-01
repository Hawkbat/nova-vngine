import { useSelector } from '../../utils/store'
import { EditorIcon } from '../common/EditorIcon'
import { COMMON_ICONS, PROJECT_TAB_ICONS } from '../common/Icons'
import { viewStateStore } from '../../store/viewstate'
import { userCreateNewProject, userOpenRecentProject, userSelectProject, useViewStateTab } from '../../store/operations'
import faviconSvgUrl from '../../favicon.svg'
import styles from './HomeWorkspace.module.css'

export const HomeWorkspace = () => {
    const [, setCurrentTab] = useViewStateTab()
    const loadedProject = useSelector(viewStateStore, s => s.loadedProject)
    const recentProjects = useSelector(viewStateStore, s => s.recentProjects)

    return <div className={styles.workspace}>
        <div className={styles.logo}>
            <img src={faviconSvgUrl} />
            Nova VNgine
        </div>
        <div className={styles.buttonGroup}>
            <EditorIcon label='New Project' path={COMMON_ICONS.newProject} showLabel onClick={() => void userCreateNewProject()} />
            <EditorIcon label='Open Project' path={COMMON_ICONS.openProject} showLabel onClick={() => void userSelectProject()} />
            <EditorIcon label='Help Manual' path={PROJECT_TAB_ICONS['manual']} showLabel onClick={() => setCurrentTab('manual')} />
            <EditorIcon label='Edit Settings' path={PROJECT_TAB_ICONS['settings']} showLabel onClick={() => setCurrentTab('settings')} />
        </div>
        {recentProjects.length ? <>
            <span className={styles.heading}>Recent Projects</span>
            <div className={styles.buttonGroup}>
                {recentProjects.map(p => <EditorIcon key={p.id} label={p.name ? p.name : 'Untitled Project'} path={PROJECT_TAB_ICONS['project']} active={p.id === loadedProject?.id} showLabel onClick={() => void userOpenRecentProject(p)} />)}
            </div>
        </> : null}
    </div>
}
