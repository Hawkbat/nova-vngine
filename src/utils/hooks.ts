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

export type DropValues = { type: 'files', files: File[] } | { type: 'json', value: unknown } | { type: 'text', value: string }

function getDropValues(dataTransfer: DataTransfer): DropValues {
    const textData = dataTransfer.getData('text/plain')
    if (textData) {
        try {
            const value = JSON.parse(textData) as unknown
            return { type: 'json', value }
        } catch (err) {
            console.error(err)
            return { type: 'text', value: textData }
        }
    }
    if (dataTransfer.files.length) {
        const files: File[] = [...dataTransfer.files]
        return { type: 'files', files }
    }
    if (dataTransfer.types.length === 0) {
        return { type: 'files', files: [] }
    }
    return { type: 'text', value: '' }
}

export function useDrag(value: unknown) {
    const [dragging, setDragging] = useState(false)
    const onDragStart = useCallback((e: React.DragEvent) => {
        e.stopPropagation()
        e.dataTransfer.setDragImage(e.currentTarget, 10, 10)
        e.dataTransfer.setData('text/plain', JSON.stringify(value))
        e.dataTransfer.dropEffect = 'move'
        setDragging(true)
    }, [value])
    const onDragEnd = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragging(false)
    }, [])
    const draggable = true
    const props: React.HTMLAttributes<HTMLElement> = useMemo(() => ({
        onDragStart,
        onDragEnd,
        draggable,
    }), [draggable, onDragStart, onDragEnd])
    return hintTuple(props, dragging)
}

export function useDrop(effect: DataTransfer['dropEffect'], dropCallback: (drops: DropValues) => void) {
    const [dragOver, setDragOver] = useState(false)
    const onDragEnter = useCallback((e: React.DragEvent) => {
        if (e.target != e.currentTarget) return
        e.stopPropagation()
        setDragOver(true)
    }, [])
    const onDragLeave = useCallback((e: React.DragEvent) => {
        if (e.target != e.currentTarget) return
        e.stopPropagation()
        setDragOver(false)
    }, [])
    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        e.dataTransfer.dropEffect = effect
        e.dataTransfer.effectAllowed = effect
    }, [effect])
    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        dropCallback(getDropValues(e.dataTransfer))
    }, [dropCallback])
    const props: React.HTMLAttributes<HTMLElement> = useMemo(() => ({
        onDragEnter,
        onDragLeave,
        onDragOver,
        onDrop,
    }), [onDragEnter, onDragLeave, onDragOver, onDrop])
    return hintTuple(props, dragOver)
}
