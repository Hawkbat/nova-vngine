import { useCallback } from 'react'

import { classes } from '../../utils/display'
import { EditorIcon } from './EditorIcon'

import styles from './EditorButton.module.css'

export type EditorButtonStyle = 'solid' | 'outline' | 'text'

const BUTTON_STYLES: Record<EditorButtonStyle, string | undefined> = {
    solid: styles.solid,
    outline: styles.outline,
    text: styles.text,
}

export const EditorButtonGroup = ({ children, side }: { children: React.ReactNode, side: 'left' | 'right' }) => {
    return <div className={classes(styles.buttonGroup, { [styles.left ?? '']: side === 'left', [styles.right ?? '']: side === 'right' })}>
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
        e.stopPropagation()
        onClick(e)
    }, [onClick])

    return <div className={classes(styles.button, BUTTON_STYLES[style ?? 'solid'], { [styles.active ?? '']: active !== undefined ? active : false, [styles.inactive ?? '']: active !== undefined ? !active : false }, className)} onClick={actualOnClick}>
        {icon ? <EditorIcon path={icon} /> : null}
        {children}
    </div>
}
