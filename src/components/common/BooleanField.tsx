import { useCallback } from "react"
import type { FieldValidateFunc } from "./Field"
import { Field } from "./Field"
import { EditorIcon } from "./EditorIcon"
import { COMMON_ICONS } from "./Icons"

export const BooleanField = ({ className, label, value, setValue, validate }: {
    className?: string
    label?: string
    value: boolean
    setValue?: (value: boolean) => void
    validate?: FieldValidateFunc<boolean>
}) => {
    
    const errorCheck = useCallback(() => {
        if (validate) return validate(value)
        return null
    }, [value, validate])

    const onClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        if (setValue) setValue(!value)
    }, [value, setValue])

    return <Field label={label} error={errorCheck()}>
        <EditorIcon className={className} path={value ? COMMON_ICONS.checkboxChecked : COMMON_ICONS.checkboxUnchecked} label={label} onClick={onClick} />
    </Field>
}
