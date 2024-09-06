import { getEntityByID, getEntityDisplayName } from '../../operations/project'
import type { EntityIDOf, EntityOfType, EntityType } from '../../types/project'
import { prettyPrintIdentifier } from '../../utils/display'
import { DropdownField } from './DropdownField'
import { EditorIcon } from './EditorIcon'
import type { FieldProps } from './Field'
import { EXPR_ICONS } from './Icons'

export const EntityField = <T extends EntityType>({ type, options, className, label, value, setValue, validate, includeParent }: FieldProps<EntityIDOf<T>> & { type: T, options: EntityOfType<T>[], includeParent?: boolean }) => {
    const entity = getEntityByID(type, value)
    const setEntityValue = setValue ? (e: EntityOfType<T> | null) => setValue((e?.id ?? '') as EntityIDOf<T>) : undefined
    const validateEntityValue = validate ? (e: EntityOfType<T> | null) => validate((e?.id ?? '') as EntityIDOf<T>) : undefined
    return <DropdownField<EntityOfType<T> | null> className={className} label={label} value={entity} setValue={setEntityValue} options={options} format={v => v ? getEntityDisplayName(type, v, includeParent ?? false) : 'None'} validate={validateEntityValue} getIcon={v => <EditorIcon path={EXPR_ICONS[type]} label={prettyPrintIdentifier(type)} />} />
}
