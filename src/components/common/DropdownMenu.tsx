import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './DropdownMenu.module.css'
import { hintTuple } from '../../utils/types'

export const useDropdownMenuState = () => {
    const [menuState, setMenuState] = useState({ open: false, x: 0, y: 0 })

    const onClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        const el = e.target as HTMLElement
        const rect = el.getBoundingClientRect()
        const x = rect.left + 10
        const y = rect.bottom - 4
        setMenuState({ open: true, x, y })
    }, [])

    const onClose = useCallback(() => {
        setMenuState({ open: false, x: 0, y: 0 })
    }, [])

    const props = useMemo(() => ({ ...menuState, onClose }), [menuState, onClose])

    return hintTuple(props, onClick)
}

export const DropdownMenu = ({ open, x, y, children, onClose }: {
    open: boolean
    x: number
    y: number
    children: React.ReactNode
    onClose: () => void
}) => {

    const onBacksplashClick = (e: React.MouseEvent) => {
        onClose()
    }

    const onMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation()
    }

    return open ? createPortal(<div className={styles.backsplash} onClick={onBacksplashClick}>
        <div className={styles.menuContainer} style={{ left: `${String(x)}px`, top: `${String(y)}px` }} onClick={onMenuClick}>
            <div className={styles.menu}>
                {children}
            </div>
        </div>
    </div>, document.body) : null
}

export const DropdownMenuItem = ({ children, onClick }: { children: React.ReactNode, onClick: (e: React.MouseEvent) => void }) => {
    return <div className={styles.menuItem} onClick={onClick}>
        {children}
    </div>
}

export const SearchDropdownMenu = <T,>(props: {
    open: boolean
    x: number
    y: number
    onClose: () => void
    items: T[]
    children: (item: T, i: number) => React.ReactNode
    filter: (item: T, search: string) => boolean
}) => {
    const { items, children, filter, ...dropdownProps } = props
    const [search, setSearch] = useState('')
    useEffect(() => {
        setSearch('')
    }, [props.open])
    return <DropdownMenu {...dropdownProps}>
        <input className={styles.searchbox} autoFocus placeholder='Search...' value={search} onChange={e => setSearch(e.target.value)} />
        {items.filter(c => filter(c, search)).map((c, i) => children(c, i))}
    </DropdownMenu>
}
