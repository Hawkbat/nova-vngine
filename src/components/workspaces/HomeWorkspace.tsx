import { projectStore } from '../../store/project'
import { useMetaSelector, useSelector } from '../../utils/store'
import { EditorIcon } from '../common/EditorIcon'
import { COMMON_ICONS, PROJECT_TAB_ICONS } from '../common/Icons'
import { viewStateStore } from '../../store/viewstate'
import { useViewStateTab, loadProjectFromFolder } from '../../store/operations'
import { openDialog } from '../common/Dialog'
import type { PlatformFilesystemEntry } from '../../types/platform'
import { isPlatformErrorCode, isProjectFile } from '../../types/platform'
import { platform } from '../../platform/platform'
import faviconSvgUrl from '../../favicon.svg'
import styles from './HomeWorkspace.module.css'
import type { ProjectMetaData } from '../../types/viewstate'

export const HomeWorkspace = () => {
    const [, setCurrentTab] = useViewStateTab()
    const [loadedProject] = useSelector(viewStateStore, s => s.loadedProject)
    const [recentProjects] = useSelector(viewStateStore, s => s.recentProjects)
    const [isDirty] = useMetaSelector(projectStore, s => s.dirty)

    const tryLoadProject = async (dir: PlatformFilesystemEntry) => {
        try {
            await loadProjectFromFolder(dir)
            setCurrentTab('project')
        } catch (err) {
            if (isPlatformErrorCode(err, 'bad-project')) {
                await openDialog('Bad Project File', err.message, { ok: 'OK' })
                return false
            }
        }
        return true
    }

    const onNewProject = async () => {
        if (isDirty) {
            const result = await openDialog('Unsaved Changes', 'You have unsaved changes. Are you sure you want to discard these changes and start a new project?', { cancel: 'Cancel', continue: 'Continue' })
            if (result === 'cancel') return
        }

        const dirResult = await platform.pickDirectory('Select project folder')
        if (!dirResult) return

        const projectFileEntry = dirResult.files.find(e => isProjectFile(e))
        if (projectFileEntry) {
            const result = await openDialog('Folder Not Empty', 'The folder you selected contains an existing project, so a new project cannot be created there. Would you like to open the project you selected instead?', { cancel: 'Cancel', continue: 'Open Project' })
            if (result === 'cancel') return
            await tryLoadProject(dirResult.directory)
            return
        }

        if (dirResult.files.length || dirResult.directories.length) {
            await openDialog('Folder Not Empty', 'The folder you selected contains files or folders already and cannot be used for new projects. Please select an empty folder.', { ok: 'OK' })
            return
        }

        await platform.createProject(dirResult.directory)
        await tryLoadProject(dirResult.directory)
    }

    const onOpenProject = async () => {
        if (isDirty) {
            const result = await openDialog('Unsaved Changes', 'You have unsaved changes. Are you sure you want to discard these changes and open a different project?', { cancel: 'Cancel', continue: 'Continue' })
            if (result === 'cancel') return
        }

        const dirResult = await platform.pickDirectory('Select project folder')
        if (!dirResult) return
        const projectFile = dirResult.files.find(f => isProjectFile(f))
        if (!projectFile) {
            await openDialog('Invalid Project', 'The folder you selected does not contain a valid project file. Please select a directory containing a valid project.', { ok: 'OK' })
            return
        }
        await tryLoadProject(dirResult.directory)
    }

    const onOpenRecentProject = async (p: ProjectMetaData) => {
        await tryLoadProject(p.directory)
    }

    const HomeButton = ({ icon, label, active, onClick }: { icon: string, label: string, active?: boolean, onClick: (e: React.MouseEvent) => void }) => {
        return <EditorIcon path={icon} label={label} showLabel active={active} onClick={onClick} />
    }

    return <div className={styles.workspace}>
        <div className={styles.logo}>
            <img src={faviconSvgUrl} />
            Nova VNgine
        </div>
        <div className={styles.buttonGroup}>
            <HomeButton label='New Project' icon={COMMON_ICONS.newProject} onClick={onNewProject} />
            <HomeButton label='Open Project' icon={COMMON_ICONS.openProject} onClick={onOpenProject} />
            <HomeButton label='Help Manual' icon={PROJECT_TAB_ICONS['manual']} onClick={() => setCurrentTab('manual')} />
            <HomeButton label='Edit Settings' icon={PROJECT_TAB_ICONS['settings']} onClick={() => setCurrentTab('settings')} />
        </div>
        {recentProjects.length ? <>
            <span className={styles.heading}>Recent Projects</span>
            <div className={styles.buttonGroup}>
                {recentProjects.map(p => <HomeButton key={p.id} label={p.name ? p.name : 'Untitled Project'} icon={PROJECT_TAB_ICONS['project']} active={p.id === loadedProject?.id} onClick={() => onOpenRecentProject(p)} />)}
            </div>
        </> : null}
    </div>
}
