import { ReactNode } from "react"
import { createPortal } from "react-dom"
import styles from './DropdownMenu.module.css'

export const DropdownMenu = ({ x, y, children, onClose }: { x: number, y: number, children: ReactNode, onClose: () => void }) => {

    const onBacksplashClick = (e: React.MouseEvent) => {
        onClose()
    }

    const onMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation()
    }

    return createPortal(<div className={styles.backsplash} onClick={onBacksplashClick}>
        <div className={styles.menu} style={{ left: `${x}px`, top: `${y}px` }} onClick={onMenuClick}>
            {children}
        </div>
    </div>, document.body)
}

export const DropdownMenuItem = ({ children, onClick }: { children: ReactNode, onClick: (e: React.MouseEvent) => void }) => {
    return <div className={styles.menuItem} onClick={onClick}>
        {children}
    </div>
}
