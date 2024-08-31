import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { hintTuple } from './types'

export function useStateFromProps<T>(value: T) {
    const [state, setState] = useState(value)
    useEffect(() => {
        setState(value)
    }, [value])
    return hintTuple(state, setState)
}

export function useLatest<T>(value: T) {
    const ref = useRef<T>(value)
    if (ref.current !== value) {
        ref.current = value
    }
    return useCallback(() => ref.current, [])
}

export function useDebounce(ms: number, callback: () => void) {
    useEffect(() => {
        const handle = setTimeout(callback, ms)
        return () => {
            clearTimeout(handle)
        }
    }, [callback, ms])
}

export function useAnimationLoop(active: boolean, callback: (deltaTime: number, elapsedTime: number) => void) {
    return useEffect(() => {
        if (!active) return
        let previousTime = 0
        let elapsedTime = 0
        const tick = (time: number) => {
            if (previousTime === 0) previousTime = time
            const deltaTime = (time - previousTime) / 1000
            previousTime = time
            elapsedTime += deltaTime

            callback(deltaTime, elapsedTime)

            handle = requestAnimationFrame(tick)
        }
        let handle = requestAnimationFrame(tick)
        return () => {
            cancelAnimationFrame(handle)
        }
    }, [active, callback])
}

export function useDrop(callback: (drops: { type: 'files', files: File[] }) => void) {
    const [dragOver, setDragOver] = useState(false)
    const onDragEnter = useCallback((e: React.DragEvent) => {
        if (e.target != e.currentTarget) return
        setDragOver(true)
    }, [])
    const onDragLeave = useCallback((e: React.DragEvent) => {
        if (e.target != e.currentTarget) return
        setDragOver(false)
    }, [])
    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        e.dataTransfer.dropEffect = 'copy'
        e.dataTransfer.effectAllowed = 'copy'
    }, [])
    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()

        void (async () => {
            if (e.dataTransfer.files.length) {
                const files: File[] = []
                for (let i = 0; i < e.dataTransfer.files.length; i++) {
                    const file = e.dataTransfer.files[i]
                    files.push(file)
                }
                callback({ type: 'files', files })
            }
        })()
    }, [callback])
    const props: React.HTMLAttributes<HTMLElement> = useMemo(() => ({
        onDragEnter,
        onDragLeave,
        onDragOver,
        onDrop,
    }), [onDragEnter, onDragLeave, onDragOver, onDrop])
    return hintTuple(props, dragOver)
}
