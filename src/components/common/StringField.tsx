import { useCallback } from "react"
import type { FieldValidateFunc } from "./Field"
import type { FieldParseFunc, FieldFormatFunc } from "./ParsedStringField"
import { ParsedStringField } from "./ParsedStringField"

export const StringField = ({ className, label, value, setValue, validate }: {
    className?: string
    label?: string
    value: string
    setValue?: (value: string) => void
    validate?: FieldValidateFunc<string>
}) => {
    const parse: FieldParseFunc<string> = useCallback(str => {
        return { success: true, value: str }
    }, [])
    const format: FieldFormatFunc<string> = useCallback((str: string) => str, [])
    return <ParsedStringField className={className} label={label} value={value} setValue={setValue} parse={parse} format={format} validate={validate} />
}
