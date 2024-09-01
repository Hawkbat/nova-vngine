import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

import { hintTuple } from '../../utils/types'

import styles from './DropdownMenu.module.css'

interface DropdownMenuState {
    open: boolean
    x: number
    y: number
    dx: -1 | 1
    dy: -1 | 1
}

export const useDropdownMenuState = () => {
    const [menuState, setMenuState] = useState<DropdownMenuState>({ open: false, x: 0, y: 0, dx: 1, dy: 1 })

    const onClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        const el = e.target as HTMLElement
        const rect = el.getBoundingClientRect()
        const dx = rect.left > window.innerWidth - 300 ? -1 : 1
        const dy = rect.bottom > window.innerHeight - 300 ? -1 : 1
        const x = rect.left + 10
        const y = rect.bottom - 4
        setMenuState({ open: true, x, y, dx, dy })
    }, [])

    const onClose = useCallback(() => {
        setMenuState({ open: false, x: 0, y: 0, dx: 1, dy: 1 })
    }, [])

    const props = useMemo(() => ({ ...menuState, onClose }), [menuState, onClose])

    return hintTuple(props, onClick)
}

export const DropdownMenu = ({ open, x, y, dx, dy, children, onClose }: DropdownMenuState & {
    children: React.ReactNode
    onClose: () => void
}) => {

    const onBacksplashClick = (e: React.MouseEvent) => {
        onClose()
    }

    const onMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation()
    }

    const left = dx === 1 ? `${String(x)}px` : undefined
    const right = dx === -1 ? `${String(window.innerWidth - x)}px` : undefined
    const top = dy === 1 ? `${String(y)}px` : undefined
    const bottom = dy === -1 ? `${String(window.innerHeight - y)}px` : undefined
    const flexDirection = dy === 1 ? 'column' : 'column-reverse'

    return open ? createPortal(<div className={styles.backsplash} onClick={onBacksplashClick}>
        <div className={styles.menuContainer} style={{ left, right, top, bottom, flexDirection }} onClick={onMenuClick}>
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

export const SearchDropdownMenu = <T,>(props: DropdownMenuState & {
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
