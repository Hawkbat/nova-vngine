import { useCallback, useEffect, useState } from "react"
import { Field } from "./Field"
import styles from './StringField.module.css'
import { useDebounce, useLatest } from "../../utils/hooks"

export const NumberField = ({ label, value, setValue }: { label: string, value: number, setValue?: (value: number) => void }) => {
    const parse: ParsedStringCallback<number> = useCallback((str: string) => {
        const n = parseFloat(str)
        if (Number.isNaN(n)) return { success: false, error: `Value is not a number` }
        return { success: true, value: n }
    }, [])
    return <ParsedStringField label={label} value={value} setValue={setValue} parse={parse} />
}

export const IntegerField = ({ label, value, setValue }: { label: string, value: number, setValue?: (value: number) => void }) => {
    const parse: ParsedStringCallback<number> = useCallback((str: string) => {
        const n = parseInt(str, 10)
        if (Number.isNaN(n)) return { success: false, error: `Value is not a number` }
        return { success: true, value: n }
    }, [])
    return <ParsedStringField label={label} value={value} setValue={setValue} parse={parse} />
}

export type ParsedStringCallback<T> = (str: string) => { success: true, value: T } | { success: false, error: string }

export const ParsedStringField = <T,>({ label, value, setValue, parse, format }: { label: string, value: T, setValue?: (value: T) => void, parse: ParsedStringCallback<T>, format?: (value: T) => string }) => {
    const validate = useCallback((str: string) => {
        const result = parse(str)
        if (result.success) return ''
        else return result.error
    }, [parse])
    const setStringValue = useCallback((str: string) => {
        const result = parse(str)
        if (result.success && setValue) {
            setValue(result.value)
            return
        }
    }, [parse, setValue])
    const stringValue = format ? format(value) : String(value)
    return <StringField label={label} value={stringValue} setValue={setValue ? setStringValue : undefined} validate={validate} />
}

export const StringField = ({ label, value, setValue, validate }: { label: string, value: string, setValue?: (value: string) => void, validate?: (value: string) => string }) => {
    const [tempValue, setTempValue] = useState(value)
    const getLatestValue = useLatest(value)
    const getLatestTempValue = useLatest(tempValue)
    const getLatestValidate = useLatest(validate)

    const errorCheck = useCallback(() => {
        const validate = getLatestValidate()
        if (validate) return validate(getLatestTempValue())
        return ''
    }, [])

    const attemptCommit = useCallback(() => {
        if (!errorCheck() && setValue) {
            const existingValue = getLatestValue()
            const newValue = getLatestTempValue()
            if (newValue !== existingValue) {
                setValue(newValue)
            }
            return true
        }
        return false
    }, [setValue])

    useEffect(() => {
        setTempValue(value)
    }, [value])

    useEffect(() => {
        return () => {
            attemptCommit()
        }
    }, [])

    useDebounce(1000, useCallback(() => attemptCommit(), [tempValue]))

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTempValue(e.target.value)
    }

    const onFocus = (e: React.FocusEvent) => {
        
    }

    const onBlur = (e: React.FocusEvent) => {
        if (!attemptCommit()) {
            setTempValue(value)
        }
    }

    const readonly = !setValue

    return <Field label={label} error={errorCheck()}>
        <input className={styles.field} type="text" readOnly={readonly} placeholder={label} onChange={onChange} onFocus={onFocus} onBlur={onBlur} value={tempValue} />
    </Field>
}
