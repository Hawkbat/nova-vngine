import { createPortal } from 'react-dom'

import styles from './ImagePreview.module.css'

export const ImagePreview = ({ src, mimeType, open, onClose }: {
    src: string
    mimeType: string
    open: boolean
    onClose: () => void
}) => {

    const onBacksplashClick = (e: React.MouseEvent) => {
        onClose()
    }

    return open ? createPortal(<div className={styles.backsplash} onClick={onBacksplashClick}>
        <picture><source srcSet={src} type={mimeType} /><img src={src} className={styles.preview} /></picture>
    </div>, document.body) : null
}
