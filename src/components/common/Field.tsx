import { classes } from '../../utils/display'
import styles from './Field.module.css'

export type FieldValidateFunc<T> = (value: T) => string | null

export const Field = ({ label, children, error }: { label?: string, children: React.ReactNode, error?: string | null }) => {
    return <div className={classes(styles.field, { [styles.invalid]: !!error })}>
        <label>
            {label ? <span className={styles.name}>{label}</span> : null}
            <div className={styles.contents}>
                {children}
                {error ? <span className={styles.error}>{error}</span> : null}
            </div>
        </label>
    </div>
}
