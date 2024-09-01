import { createPortal } from 'react-dom'

import styles from './ImagePreview.module.css'

export const ImagePreview = ({ src, open, onClose }: {
    src: string
    open: boolean
    onClose: () => void
}) => {

    const onBacksplashClick = (e: React.MouseEvent) => {
        onClose()
    }

    return open ? createPortal(<div className={styles.backsplash} onClick={onBacksplashClick}>
        <img src={src} className={styles.preview} />
    </div>, document.body) : null
}
