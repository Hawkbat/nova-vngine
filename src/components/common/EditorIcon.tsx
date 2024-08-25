import { Icon } from '@mdi/react'
import styles from './EditorIcon.module.css'
import { classes } from '../../utils/display'
import { useCallback } from 'react'

export const EditorIcon = ({ path, label, size, active, showLabel, onClick }: { path: string, label?: string, size?: number, active?: boolean, showLabel?: boolean, onClick?: (e: React.MouseEvent) => void }) => {
    
    const actualOnClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        onClick?.(e)
    }, [onClick])

    return <div className={classes(styles.icon, { [styles.active]: active ?? true, [styles.clickable]: !!onClick })} onClick={actualOnClick}>
        <Icon path={path} title={label} size={`${size ?? 1}em`} />
        {showLabel ? <span>{label}</span> : null}
    </div>
}
