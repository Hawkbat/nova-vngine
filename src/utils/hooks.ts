import { useEffect, useRef, useState } from "react"
import { hintTypeTuple } from "./types"

export function useStateFromProps<T>(value: T) {
    const [state, setState] = useState(value)
    useEffect(() => {
        setState(value)
    }, [value])
    return hintTypeTuple(state, setState)
}

export function useLatest<T>(value: T) {
    const ref = useRef<T>(value)
    if (ref.current !== value) {
        ref.current = value
    }
    return () => ref.current
}

export function useDebounce(ms: number, callback: () => void) {
    useEffect(() => {
        const handle = setTimeout(callback, ms)
        return () => {
            clearTimeout(handle)
        }
    }, [callback, ms])
}
