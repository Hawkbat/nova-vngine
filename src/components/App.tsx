import styles from './App.module.css'
import { Dialog } from './common/Dialog'
import { ProjectEditor } from './editors/ProjectEditor'

export const App = () => {
    return <div className={styles.App}>
        <ProjectEditor />
        <Dialog />
    </div>
}
