import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { existsFilter, throwIfNull } from '../../utils/guard'
import { useLatest } from '../../utils/hooks'
import { shallowEquals } from '../../utils/imm'

export type TransitionState = 'in' | 'out' | ''

export interface TransitionProps {
    key: string
    state: TransitionState
    end: (key: string) => void
}

const transitionContext = createContext<TransitionProps | null>(null)

const TransitionItem = <T,>(props: TransitionProps & { $key: string, value: T, children: (props: T, transition: TransitionProps) => React.ReactNode }) => {
    const { value, children, $key, state, end } = props
    const transitionProps = useMemo<TransitionProps>(() => ({ key: $key, state, end }), [end, state, $key])
    return <transitionContext.Provider value={transitionProps}>{children(value, transitionProps)}</transitionContext.Provider>
}

interface TransitionGroupEntry<T> {
    key: string
    state: TransitionState
    props: T
}

interface TransitionGroupProps<T> {
    values: T[]
    getKey: (value: T) => string
    sort?: (a: T, b: T) => number
    children: (props: T, transition: TransitionProps) => React.ReactNode
}

export const TransitionGroup = <T,>({ values, getKey, sort, children }: TransitionGroupProps<T>) => {
    const latestGetKey = useLatest(getKey)
    const [entries, setEntries] = useState<Record<string, TransitionGroupEntry<T> | undefined>>({})
    const latestEntries = useLatest(entries)

    const add = useCallback((value: T, index: number) => {
        const key = latestGetKey()(value)
        const entry: TransitionGroupEntry<T> = {
            key: key,
            props: value,
            state: 'in',
        }
        setEntries(e => ({ ...e, [key]: entry }))
    }, [latestGetKey])

    const remove = useCallback((key: string) => {
        const entry = latestEntries()[key]
        if (entry) {
            setEntries(e => ({ ...e, [key]: undefined }))
        }
    }, [latestEntries])

    const changeProps = useCallback((key: string, props: T) => {
        const entry = latestEntries()[key]
        if (!entry || shallowEquals(entry.props, props)) return
        setEntries(e => ({ ...e, [key]: e[key] ? { ...e[key], props } : undefined }))
    }, [latestEntries])

    const changeState = useCallback((key: string, state: TransitionState) => {
        const entry = latestEntries()[key]
        if (!entry || entry.state === state) return
        setEntries(e => ({ ...e, [key]: e[key] ? { ...e[key], state } : undefined }))
    }, [latestEntries])

    const onEnd = useCallback((key: string) => {
        const entry = latestEntries()[key]
        if (!entry) return
        if (entry.state === 'in') {
            changeState(key, '')
        } else if (entry.state === 'out') {
            remove(key)
        }
    }, [latestEntries, changeState, remove])

    useEffect(() => {
        Object.values(entries).filter(existsFilter).forEach(e => {
            if (!values.length || !values.some(v => latestGetKey()(v) === e.key)) {
                changeState(e.key, 'out')
            }
        })
        values.forEach((v, i) => {
            const key = latestGetKey()(v)
            const entry = entries[key]
            if (entry) {
                if (entry.state === 'out') changeState(key, 'in')
                changeProps(key, v)
            } else {
                add(v, i)
            }
        })
    }, [entries, latestGetKey, add, changeState, changeProps, values])

    return <>
        {Object.values(entries).filter(existsFilter).sort((a, b) => sort?.(a.props, b.props) ?? 0).map(v => <TransitionItem key={v.key} $key={v.key} value={v.props} state={v.state} end={onEnd}>{children}</TransitionItem>)}
    </>
}

export function useTransitionAnimationRef(ready: boolean, animations: { in: Keyframe[], inT: KeyframeAnimationOptions, out: Keyframe[], outT: KeyframeAnimationOptions }) {
    const props = useTransitionState()
    const ref = useRef<HTMLElement>(null)
    const latestAnimations = useLatest(animations)
    useLayoutEffect(() => {
        if (!ref.current) return
        const anims = latestAnimations()
        if (props.state === 'in' || props.state === 'out') {
            const anim = ref.current.animate(props.state === 'in' ? anims.in : anims.out, { fill: 'forwards', duration: 200, ...(props.state === 'in' ? anims.inT : anims.outT) })
            if (!ready) anim.pause()
            anim.addEventListener('finish', () => props.end(props.key))
            return () => {
                anim.cancel()
            }
        }
        return () => {}
    }, [latestAnimations, props, ready])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ref as React.RefObject<any>
}

export function useTransitionState() {
    return throwIfNull(useContext(transitionContext))
}
