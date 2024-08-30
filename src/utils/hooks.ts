import { useCallback, useEffect, useRef, useState } from 'react'
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
