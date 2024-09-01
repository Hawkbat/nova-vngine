import { ErrorBoundary, type ErrorBoundaryProps } from 'react-error-boundary'
import { Dialog } from './common/Dialog'
import { ProjectEditor } from './editors/ProjectEditor'
import styles from './App.module.css'
import { openErrorDialog } from '../utils/debug'

export const App = () => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    const onError: ErrorBoundaryProps['onError'] = async (err, info) => {
        await openErrorDialog(err, info.componentStack ?? '', info.digest ?? '')
    }
    return <div className={styles.App}>
        <ErrorBoundary onError={onError} fallback={<div>An unrecoverable error has occurred.</div>}>
            <ProjectEditor />
        </ErrorBoundary>
        <Dialog />
    </div>
}
