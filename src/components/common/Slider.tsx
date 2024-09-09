import { useCallback } from 'react'

import { classes } from '../../utils/display'

import styles from './Slider.module.css'

export const Slider = ({ className, value, setValue, min, max, step, inputRef: ref }: {
    className?: string
    value: number
    setValue?: (value: number) => void
    min?: number
    max?: number
    step?: number
    inputRef?: React.RefObject<HTMLInputElement>
}) => {
    const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation()
        const v = parseFloat(e.target.value)
        if (!Number.isNaN(v)) {
            setValue?.(v)
        }
    }, [setValue])
    return <input ref={ref} className={classes(styles.slider, className)} type='range' value={value} min={min ?? 0} max={max ?? 1} step={step ?? 'any'} onChange={onChange} />
}
