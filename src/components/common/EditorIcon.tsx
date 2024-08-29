import { Icon } from '@mdi/react'
import styles from './EditorIcon.module.css'
import { classes } from '../../utils/display'
import { useCallback } from 'react'

export type EditorIconStyle = 'solid' | 'outline' | 'text'

const ICON_STYLES: Record<EditorIconStyle, string> = {
    solid: styles.solid,
    outline: styles.outline,
    text: styles.text,
}

export const EditorIcon = ({ path, label, style, size, active, showLabel, className, onClick }: {
    path: string
    label?: string
    style?: EditorIconStyle
    size?: number
    active?: boolean
    showLabel?: boolean
    className?: string
    onClick?: (e: React.MouseEvent) => void
}) => {

    const actualOnClick = useCallback((e: React.MouseEvent) => {
        if (onClick) {
            e.stopPropagation()
            onClick(e)
        }
    }, [onClick])

    return <div className={classes(styles.icon, ICON_STYLES[style ?? 'text'], { [styles.active]: active !== undefined ? active : false, [styles.inactive]: active !== undefined ? !active : false, [styles.clickable]: !!onClick }, className)} onClick={actualOnClick}>
        <Icon path={path} title={label} size={`${String(size ?? 1)}em`} />
        {showLabel ? <span>{label}</span> : null}
    </div>
}
