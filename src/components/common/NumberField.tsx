import { useCallback } from 'react'

import { useDebounce, useStateFromProps } from '../../utils/hooks'
import type { FieldProps } from './Field'
import type { FieldFormatFunc, FieldParseFunc } from './ParsedStringField'
import { ParsedStringField } from './ParsedStringField'
import { Slider } from './Slider'

import styles from './NumberField.module.css'

export const NumberField = ({ className, label, value, setValue, validate, min, max, step, slider }: FieldProps<number> & { min?: number, max?: number, step?: number, slider?: boolean }) => {
    const [sliderValue, setSliderValue] = useStateFromProps(value)

    const parse: FieldParseFunc<number> = useCallback((str: string) => {
        const n = parseFloat(str)
        if (Number.isNaN(n)) return { success: false, error: 'Value is not a number' }
        return { success: true, value: n }
    }, [])
    const format: FieldFormatFunc<number> = useCallback((n: number) => String(n), [])

    const onSetSliderValue = useCallback((value: number) => {
        const result = parse(String(value))
        if (result.success) {
            setSliderValue(result.value)
        }
    }, [parse, setSliderValue])

    const doValidate = useCallback((value: number): string | null => {
        const validateResult = validate?.(value)
        if (validateResult) return validateResult
        if (min !== undefined && value < min) return `Value must be greater than or equal to ${String(min)}`
        if (max !== undefined && value > max) return `Value must be less than or equal to ${String(max)}`
        return null
    }, [max, min, validate])

    useDebounce(1000, useCallback(() => {
        if (sliderValue !== value) setValue?.(sliderValue)
    }, [setValue, sliderValue, value]))

    return <ParsedStringField className={className} label={label} value={slider ? sliderValue : value} setValue={setValue} parse={parse} format={format} validate={doValidate}>
        {slider ? <Slider value={sliderValue} setValue={onSetSliderValue} min={min} max={max} step={step} /> : null}
    </ParsedStringField>
}
