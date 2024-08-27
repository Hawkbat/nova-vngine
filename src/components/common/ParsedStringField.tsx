import { useCallback, useEffect, useState } from "react"
import type { FieldProps } from "./Field"
import { Field } from "./Field"
import { useDebounce, useLatest } from "../../utils/hooks"
import { classes } from "../../utils/display"
import styles from './ParsedStringField.module.css'

export type FieldFormatFunc<T> = (value: T) => string
export type FieldParseFunc<T> = (str: string) => { success: true, value: T } | { success: false, error: string }

export const ParsedStringField = <T,>({ className, label, value, setValue, validate, parse, format }: FieldProps<T> & { parse: FieldParseFunc<T>, format: FieldFormatFunc<T>}) => {    
    const [tempValue, setTempValue] = useState(format(value))
    const [hasFocus, setHasFocus] = useState(false)
    const getLatestValue = useLatest(value)
    const getLatestTempValue = useLatest(tempValue)
    const getLatestValidate = useLatest(validate)
    const getLatestParse = useLatest(parse)
    const getLatestFormat = useLatest(format)

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
        if (!hasFocus) {
            setTempValue(getLatestFormat()(value))
        }
    }, [getLatestFormat, hasFocus, value])

    useEffect(() => {
        return () => {
            attemptCommit(getLatestTempValue())
        }
    }, [attemptCommit, getLatestTempValue])

    useDebounce(1000, useCallback(() => attemptCommit(tempValue), [attemptCommit, tempValue]))

    const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setTempValue(e.target.value)
    }, [])

    const onFocus = useCallback((e: React.FocusEvent) => {
        setHasFocus(true)
    }, [])

    const onBlur = useCallback((e: React.FocusEvent) => {
        if (!attemptCommit(getLatestTempValue())) {
            setTempValue(getLatestFormat()(getLatestValue()))
        }
        setHasFocus(false)
    }, [attemptCommit, getLatestFormat, getLatestTempValue, getLatestValue])

    const readonly = !setValue

    return <Field label={label} error={errorCheck()}>
        <input className={classes(styles.field, className)} type="text" readOnly={readonly} placeholder={label} onChange={onChange} onFocus={onFocus} onBlur={onBlur} value={tempValue} />
    </Field>
}
