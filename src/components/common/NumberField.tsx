import { useCallback } from 'react'

import type { FieldProps } from './Field'
import type { FieldFormatFunc, FieldParseFunc } from './ParsedStringField'
import { ParsedStringField } from './ParsedStringField'

export const NumberField = ({ className, label, value, setValue, validate }: FieldProps<number>) => {
    const parse: FieldParseFunc<number> = useCallback((str: string) => {
        const n = parseFloat(str)
        if (Number.isNaN(n)) return { success: false, error: 'Value is not a number' }
        return { success: true, value: n }
    }, [])
    const format: FieldFormatFunc<number> = useCallback((n: number) => String(n), [])
    return <ParsedStringField className={className} label={label} value={value} setValue={setValue} parse={parse} format={format} validate={validate} />
}
