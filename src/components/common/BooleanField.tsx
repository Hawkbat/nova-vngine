import { useCallback } from 'react'

import { classes } from '../../utils/display'
import { EditorIcon } from './EditorIcon'
import type { FieldProps } from './Field'
import { Field } from './Field'
import { COMMON_ICONS } from './Icons'

import styles from './BooleanField.module.css'

export const BooleanField = ({ className, label, value, setValue, validate }: FieldProps<boolean>) => {

    const errorCheck = useCallback(() => {
        if (validate) return validate(value)
        return null
    }, [value, validate])

    const onClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        if (setValue) setValue(!value)
    }, [value, setValue])

    return <Field label={label} error={errorCheck()}>
        <EditorIcon className={classes(className, styles.checkbox)} path={value ? COMMON_ICONS.checkboxChecked : COMMON_ICONS.checkboxUnchecked} label={label} onClick={onClick} />
    </Field>
}
