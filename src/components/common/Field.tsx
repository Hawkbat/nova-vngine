import { classes } from '../../utils/display'
import styles from './Field.module.css'

export const Field = ({ label, children, error }: { label: string, children: React.ReactNode, error?: string }) => {
    return <div className={classes(styles.field, { [styles.invalid]: !!error })}>
        <label>
            <span className={styles.name}>{label}</span>
            <div className={styles.contents}>
                {children}
                {error ? <span className={styles.error}>{error}</span> : null}
            </div>
        </label>
    </div>
}
