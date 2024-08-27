import { useCallback } from 'react'
import { classes } from '../../utils/display'
import styles from './EditorButton.module.css'
import { EditorIcon } from './EditorIcon'

export type EditorButtonStyle = 'solid' | 'outline' | 'text'

const BUTTON_STYLES: Record<EditorButtonStyle, string> = {
    solid: styles.solid,
    outline: styles.outline,
    text: styles.text,
}

export const EditorButtonGroup = ({ children }: { children: React.ReactNode }) => {
    return <div className={styles.buttonGroup}>
        {children}
    </div>
}

export const EditorButton = ({ className, icon, style, active, children, onClick }: {
    className?: string
    icon?: string
    style?: EditorButtonStyle
    active?: boolean
    children: React.ReactNode
    onClick: (e: React.MouseEvent) => void
}) => {

    const actualOnClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        onClick(e)
    }, [onClick])
    
    return <div className={classes(styles.button, BUTTON_STYLES[style ?? 'solid'], { [styles.active]: active !== undefined ? active : false, [styles.inactive]: active !== undefined ? !active : false }, className)} onClick={actualOnClick}>
        {icon ? <EditorIcon path={icon} /> : null}
        {children}
    </div>
}
