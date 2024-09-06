import { Icon } from '@mdi/react'
import { useCallback } from 'react'

import { classes } from '../../utils/display'
import { getPathIsUrl } from '../../utils/path'

import styles from './PlayerIcon.module.css'

export const PlayerIcon = ({ className, path, mimeType, label, size, active, anim, onClick }: {
    className?: string
    path: string
    mimeType?: string
    label?: string
    size?: number
    active?: boolean
    anim?: 'bob' | 'spin'
    onClick?: (e: React.MouseEvent) => void
}) => {
    const isImage = getPathIsUrl(path)

    const actualOnClick = useCallback((e: React.MouseEvent) => {
        if (onClick) {
            e.stopPropagation()
            onClick(e)
        }
    }, [onClick])

    return <div className={classes(styles.icon, { [styles.active ?? '']: active !== undefined ? active : false, [styles.inactive ?? '']: active !== undefined ? !active : false, [styles.clickable ?? '']: !!onClick, [styles.spinning ?? '']: anim === 'spin', [styles.bobbing ?? '']: anim === 'bob' }, className)} onClick={actualOnClick}>
        {isImage ? <picture><source srcSet={path} type={mimeType} /><img src={path} className={styles.iconImage} /></picture> : <Icon path={path} title={label} size={`${String(size ?? 1)}em`} />}
    </div>
}
