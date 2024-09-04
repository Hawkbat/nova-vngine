import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { existsFilter } from '../../utils/guard'
import { useLatest } from '../../utils/hooks'
import { inlineThrow } from '../../utils/types'

export type TransitionState = 'in' | 'out' | ''

export interface TransitionProps {
    tkey: string
    state: TransitionState
    end: (tkey: string) => void
}

const transitionContext = createContext<TransitionProps | null>(null)

const TransitionItem = <T,>(props: TransitionProps & { value: T, children: (props: T, transition: TransitionProps) => React.ReactNode }) => {
    const { value, children, tkey, state, end } = props
    const transitionProps = useMemo(() => ({ tkey, state, end }), [end, state, tkey])
    return <transitionContext.Provider value={transitionProps}>{children(value, transitionProps)}</transitionContext.Provider>
}

const noOp = () => inlineThrow(new Error('Tried to end transition when no transition was in progress'))

interface TransitionGroupEntry<T> {
    tkey: string
    state: TransitionState
    props: T
    sort: number
}

export const TransitionGroup = <T,>({ values, getKey, children }: { values: T[], getKey: (value: T) => string, children: (props: T, transition: TransitionProps) => React.ReactNode }) => {
    const latestGetKey = useLatest(getKey)
    const [entries, setEntries] = useState<Record<string, TransitionGroupEntry<T> | undefined>>({})
    const latestEntries = useLatest(entries)

    const add = useCallback((value: T, index: number) => {
        const key = latestGetKey()(value)
        setEntries(e => ({
            ...e,
            [key]: {
                tkey: key,
                props: value,
                state: 'in',
                sort: index,
            },
        }))
    }, [latestGetKey])

    const remove = useCallback((key: string) => {
        const entry = latestEntries()[key]
        if (entry) {
            setEntries(e => ({ ...e, [key]: undefined }))
        }
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
        Object.values(latestEntries()).filter(existsFilter).forEach(e => {
            if (!values.length || !values.some(v => latestGetKey()(v) === e.tkey)) {
                changeState(e.tkey, 'out')
            }
        })
        values.forEach((v, i) => {
            const key = latestGetKey()(v)
            const entry = latestEntries()[key]
            if (!entry) {
                add(v, i)
            }
        })
    }, [latestEntries, latestGetKey, add, changeState, values])

    return <>
        {Object.values(entries).filter(existsFilter).sort((a, b) => a.sort - b.sort).map(v => <TransitionItem key={v.tkey} tkey={v.tkey} value={v.props} state={v.state} end={onEnd}>{children}</TransitionItem>)}
    </>
}

export const OldTransitionGroup = <T,>({ values, getKey, children }: { values: T[], getKey: (value: T) => string, children: (props: T, transition: TransitionProps) => React.ReactNode }) => {
    const latestGetKey = useLatest(getKey)
    const [addedValues, setAddedValues] = useState<T[]>([])
    const latestAddedValues = useLatest(addedValues)
    const [currentValues, setCurrentValues] = useState<T[]>([])
    const latestCurrentValues = useLatest(currentValues)
    const [removedValues, setRemovedValues] = useState<T[]>([])
    const latestRemovedValues = useLatest(removedValues)

    const findValue = useCallback((key: string) => {
        const value = latestAddedValues().find(v => getKey(v) === key) ?? latestCurrentValues().find(v => getKey(v) === key) ?? latestRemovedValues().find(v => getKey(v) === key)
        return value
    }, [getKey, latestAddedValues, latestCurrentValues, latestRemovedValues])

    const updateArray = useCallback((arr: T[], key: string, value?: T) => {
        if (value) {
            return arr.filter(v => latestGetKey()(v) !== key).concat(value)
        }
        if (!arr.length) return arr
        if (arr.some(v => latestGetKey()(v) === key)) {
            return arr.filter(v => latestGetKey()(v) !== key)
        }
        return arr
    }, [latestGetKey])

    const addItem = useCallback((value: T) => {
        const key = latestGetKey()(value)
        setAddedValues(arr => updateArray(arr, key, value))
        setCurrentValues(arr => updateArray(arr, key))
        setRemovedValues(arr => updateArray(arr, key))
    }, [latestGetKey, updateArray])

    const onStartTransitionIn = useCallback((key: string) => {
        const value = findValue(key)
        setAddedValues(arr => updateArray(arr, key, value))
        setCurrentValues(arr => updateArray(arr, key))
        setRemovedValues(arr => updateArray(arr, key))
    }, [findValue, updateArray])

    const onEndTransitionIn = useCallback((key: string) => {
        const value = findValue(key)
        setAddedValues(arr => updateArray(arr, key))
        setCurrentValues(arr => updateArray(arr, key, value))
        setRemovedValues(arr => updateArray(arr, key))
    }, [findValue, updateArray])

    const onStartTransitionOut = useCallback((key: string) => {
        const value = findValue(key)
        setAddedValues(arr => updateArray(arr, key))
        setCurrentValues(arr => updateArray(arr, key))
        setRemovedValues(arr => updateArray(arr, key, value))
    }, [findValue, updateArray])

    const onEndTransitionOut = useCallback((key: string) => {
        setAddedValues(arr => updateArray(arr, key))
        setCurrentValues(arr => updateArray(arr, key))
        setRemovedValues(arr => updateArray(arr, key))
    }, [updateArray])

    useEffect(() => {
        latestCurrentValues().forEach(value => {
            const key = getKey(value)
            if (!latestRemovedValues().find(v => getKey(v) === key) && !values.find(v => getKey(v) === key)) {
                onStartTransitionOut(key)
            }
        })
        values.forEach(value => {
            const key = getKey(value)
            if (!latestAddedValues().find(v => getKey(v) === key) && !latestCurrentValues().find(v => getKey(v) === key)) {
                addItem(value)
            }
        })
    }, [addItem, getKey, latestAddedValues, latestCurrentValues, latestRemovedValues, onStartTransitionOut, values])

    return <>
        {[
            ...removedValues.map(v => <TransitionItem key={getKey(v)} tkey={getKey(v)} value={v} state='out' end={onEndTransitionOut}>{children}</TransitionItem>),
            ...currentValues.map(v => <TransitionItem key={getKey(v)} tkey={getKey(v)} value={v} state='' end={noOp}>{children}</TransitionItem>),
            ...addedValues.map(v => <TransitionItem key={getKey(v)} tkey={getKey(v)} value={v} state='in' end={onEndTransitionIn}>{children}</TransitionItem>),
        ]}
    </>
}

export function useTransitionAnimationRef(ready: boolean, animations: { in: Keyframe[], inT: KeyframeAnimationOptions, out: Keyframe[], outT: KeyframeAnimationOptions }) {
    const props = useTransition()
    const ref = useRef<HTMLElement>(null)
    const latestAnimations = useLatest(animations)
    useLayoutEffect(() => {
        if (!ref.current) return
        if (!props) return
        const anims = latestAnimations()
        if (props.state === 'in' || props.state === 'out') {
            const anim = ref.current.animate(props.state === 'in' ? anims.in : anims.out, { fill: 'forwards', duration: 200, ...(props.state === 'in' ? anims.inT : anims.outT) })
            if (!ready) anim.pause()
            anim.addEventListener('finish', () => props.end(props.tkey))
            return () => {
                anim.cancel()
            }
        }
        return () => {}
    }, [latestAnimations, props, ready])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ref as React.RefObject<any>
}

export function useTransition() {
    return useContext(transitionContext)
}
