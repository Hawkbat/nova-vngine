import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import { useProjectReadonly } from '../../operations/storage'
import { classes } from '../../utils/display'
import { useDebounce, useLatest } from '../../utils/hooks'
import type { FieldProps } from './Field'
import { Field } from './Field'

import styles from './ParsedStringField.module.css'

export type FieldFormatFunc<T> = (value: T) => string
export type FieldParseFunc<T> = (str: string) => { success: true, value: T } | { success: false, error: string }

export const ParsedStringField = <T,>({ className, label, value, setValue, validate, parse, format, children }: FieldProps<T> & { parse: FieldParseFunc<T>, format: FieldFormatFunc<T>, children?: React.ReactNode }) => {
    const projectReadonly = useProjectReadonly()
    const [tempValue, setTempValue] = useState(format(value))
    const hasFocusRef = useRef(false)
    const getLatestValue = useLatest(value)
    const getLatestTempValue = useLatest(tempValue)
    const getLatestValidate = useLatest(validate)
    const getLatestParse = useLatest(parse)
    const getLatestFormat = useLatest(format)
    const inputRef = useRef<HTMLInputElement>(null)
    const measureRef = useRef<HTMLSpanElement>(null)

    useLayoutEffect(() => {
        if (!inputRef.current || !measureRef.current) return
        inputRef.current.style.width = `${String(measureRef.current.scrollWidth)}px`
    }, [tempValue])

    const errorCheck = useCallback(() => {
        const result = getLatestParse()(getLatestTempValue())
        if (!result.success) return result.error
        const validate = getLatestValidate()
        if (validate) return validate(result.value)
        return null
    }, [getLatestParse, getLatestTempValue, getLatestValidate])

    const attemptCommit = useCallback((stringValue: string) => {
        if (setValue) {
            const result = getLatestParse()(stringValue)
            if (result.success) {
                const validate = getLatestValidate()
                if (!validate?.(result.value)) {
                    if (result.value !== getLatestValue()) {
                        setValue(result.value)
                    }
                }
                return true
            }
        }
        return false
    }, [getLatestParse, getLatestValidate, getLatestValue, setValue])

    useEffect(() => {
        if (!hasFocusRef.current) {
            setTempValue(getLatestFormat()(value))
        }
    }, [getLatestFormat, value])

    useDebounce(1000, useCallback(() => attemptCommit(tempValue), [attemptCommit, tempValue]))

    const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setTempValue(e.target.value)
    }, [])

    const onFocus = useCallback((e: React.FocusEvent) => {
        hasFocusRef.current = true
    }, [])

    const onBlur = useCallback((e: React.FocusEvent) => {
        if (!attemptCommit(getLatestTempValue())) {
            setTempValue(getLatestFormat()(getLatestValue()))
        }
        hasFocusRef.current = false
    }, [attemptCommit, getLatestFormat, getLatestTempValue, getLatestValue])

    const readonly = !setValue || projectReadonly

    return <Field label={label} error={errorCheck()}>
        <span ref={measureRef} className={styles.measure}>{tempValue ? tempValue : label}</span>
        {children}
        <input ref={inputRef} className={classes(styles.field, className)} type='text' readOnly={readonly} placeholder={label} onChange={onChange} onFocus={onFocus} onBlur={onBlur} value={tempValue} />
    </Field>
}
