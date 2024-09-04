import { useCallback } from 'react'

import type { LocationHeightValue, LocationPositionValue, LocationScaleValue, LocationValue } from '../../types/expressions'
import { prettyPrintIdentifier } from '../../utils/display'
import { immSet } from '../../utils/imm'
import { DropdownField } from './DropdownField'
import { Field, type FieldProps } from './Field'
import { NumberField } from './NumberField'

export const LocationPositionField = ({ className, label, value, setValue, validate }: FieldProps<LocationPositionValue>) => {
    const errorCheck = useCallback(() => {
        if (validate) return validate(value)
        return null
    }, [value, validate])

    return <Field label={label} error={errorCheck()}>
        <DropdownField<LocationPositionValue> className={className} value={value} setValue={setValue} options={['auto', 'left', 'center', 'right', typeof value === 'number' ? value : 0.5]} format={v => typeof v === 'string' ? prettyPrintIdentifier(v) : 'Custom'} />
        {typeof value === 'number' ? <NumberField value={value} setValue={setValue} /> : null}
    </Field>
}

export const LocationHeightField = ({ className, label, value, setValue, validate }: FieldProps<LocationHeightValue>) => {
    const errorCheck = useCallback(() => {
        if (validate) return validate(value)
        return null
    }, [value, validate])

    return <Field label={label} error={errorCheck()}>
        <DropdownField<LocationHeightValue> className={className} value={value} setValue={setValue} options={['auto', 'full', 'knees', 'thighs', 'waist', 'shoulder', 'head', typeof value === 'number' ? value : 0.5]} format={v => typeof v === 'string' ? prettyPrintIdentifier(v) : 'Custom'} />
        {typeof value === 'number' ? <NumberField value={value} setValue={setValue} /> : null}
    </Field>
}

export const LocationScaleField = ({ className, label, value, setValue, validate }: FieldProps<LocationScaleValue>) => {
    const errorCheck = useCallback(() => {
        if (validate) return validate(value)
        return null
    }, [value, validate])

    return <Field label={label} error={errorCheck()}>
        <DropdownField<LocationScaleValue> className={className} value={value} setValue={setValue} options={['auto', 'far', 'middle', 'near', typeof value === 'number' ? value : 0.5]} format={v => typeof v === 'string' ? prettyPrintIdentifier(v) : 'Custom'} />
        {typeof value === 'number' ? <NumberField value={value} setValue={setValue} /> : null}
    </Field>
}

export const LocationField = ({ className, label, value, setValue, validate }: FieldProps<LocationValue>) => {
    return <>
        <LocationPositionField className={className} label='Position' value={value.position} setValue={v => setValue?.(immSet(value, 'position', v))} />
        <LocationHeightField className={className} label='Height' value={value.height} setValue={v => setValue?.(immSet(value, 'height', v))} />
        <LocationScaleField className={className} label='Scale' value={value.scale} setValue={v => setValue?.(immSet(value, 'scale', v))} />
    </>
}
