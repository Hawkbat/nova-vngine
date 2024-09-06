import { useCallback } from 'react'

import { DropdownMenuItem, SearchDropdownMenu, useDropdownMenuState } from './DropdownMenu'
import { EditorButton } from './EditorButton'
import { EditorIcon } from './EditorIcon'
import { Field, type FieldProps } from './Field'
import { COMMON_ICONS } from './Icons'

export const DropdownField = <T,>({ className, label, value, setValue, validate, options, format = String, getIcon }: FieldProps<T> & { options: T[], format?: (value: T) => string, getIcon?: (value: T) => React.ReactNode }) => {
    const [dropdownProps, openDropdown] = useDropdownMenuState()

    const errorCheck = useCallback(() => {
        if (validate) return validate(value)
        return null
    }, [value, validate])

    return <Field label={label} error={errorCheck()}>
        <EditorButton className={className} style='text' onClick={openDropdown}>{getIcon ? getIcon(value) : null}{format(value)} <EditorIcon path={COMMON_ICONS.dropdownArrow} /></EditorButton>
        <SearchDropdownMenu {...dropdownProps} items={options} filter={(item, search) => format(item).toLowerCase().includes(search.toLowerCase())}>{(item, i) => <DropdownMenuItem key={i} onClick={() => (setValue?.(item), dropdownProps.onClose())}>{getIcon ? getIcon(item) : null}{format(item)}</DropdownMenuItem>}</SearchDropdownMenu>
    </Field>
}

