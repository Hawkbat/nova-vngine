import { Icon } from '@mdi/react'
import { useCallback } from 'react'

import { classes } from '../../utils/display'
import { getPathIsUrl } from '../../utils/path'

import styles from './EditorIcon.module.css'

export type EditorIconStyle = 'solid' | 'outline' | 'text'

const ICON_STYLES: Record<EditorIconStyle, string | undefined> = {
    solid: styles.solid,
    outline: styles.outline,
    text: styles.text,
}

export const EditorIcon = ({ path, mimeType, label, style, size, active, showLabel, anim, className, onClick }: {
    path: string
    mimeType?: string
    label?: string
    style?: EditorIconStyle
    size?: number
    active?: boolean
    showLabel?: boolean
    anim?: 'spin'
    className?: string
    onClick?: (e: React.MouseEvent) => void
}) => {
    const isImage = getPathIsUrl(path)

    const actualOnClick = useCallback((e: React.MouseEvent) => {
        if (onClick) {
            e.stopPropagation()
            onClick(e)
        }
    }, [onClick])

    return <div className={classes(styles.icon, ICON_STYLES[style ?? 'text'], { [styles.active ?? '']: active !== undefined ? active : false, [styles.inactive ?? '']: active !== undefined ? !active : false, [styles.clickable ?? '']: !!onClick }, anim === 'spin' && styles.spinning, className)} onClick={actualOnClick}>
        {isImage ? <picture><source srcSet={path} type={mimeType} /><img src={path} className={styles.iconImage} /></picture> : <Icon path={path} title={label} size={`${String(size ?? 1)}em`} />}
        {showLabel ? <span>{label}</span> : null}
    </div>
}
