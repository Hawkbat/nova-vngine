import { useCallback } from "react"
import type { FieldValidateFunc } from "./Field"
import type { FieldParseFunc, FieldFormatFunc } from "./ParsedStringField"
import { ParsedStringField } from "./ParsedStringField"

export const IntegerField = ({ className, label, value, setValue, validate }: {
    className?: string
    label?: string
    value: number
    setValue?: (value: number) => void
    validate?: FieldValidateFunc<number>
}) => {
    const parse: FieldParseFunc<number> = useCallback((str: string) => {
        const n = parseInt(str, 10)
        if (Number.isNaN(n)) return { success: false, error: `Value is not a number` }
        return { success: true, value: n }
    }, [])
    const format: FieldFormatFunc<number> = useCallback((n: number) => String(n), [])
    return <ParsedStringField className={className} label={label} value={value} setValue={setValue} parse={parse} format={format} validate={validate} />
}
