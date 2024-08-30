import { useCallback } from 'react'
import { EditorIcon } from './EditorIcon'
import type { FieldProps } from './Field'
import { Field } from './Field'
import { COMMON_ICONS } from './Icons'
import { getStorageProvider } from '../../platform/storage/storage'
import styles from './UploadField.module.css'
import { useSelector } from '../../utils/store'
import { viewStateStore } from '../../store/viewstate'
import type { StorageFileResult } from '../../types/storage'

export const UploadField = ({ className, label, value, setValue, validate, fileType, extensions, multi, startIn }: FieldProps<StorageFileResult[]> & { fileType: string, extensions: string[], multi?: boolean, startIn?: string }) => {
    const [root] = useSelector(viewStateStore, s => s.loadedProject?.root)

    const errorCheck = useCallback(() => {
        if (validate) return validate(value)
        return null
    }, [value, validate])

    const onClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()

        void (async () => {
            if (!root) return

            const storage = getStorageProvider(root.type)

            const files = await storage.pickFiles?.(root, { title: label, fileType, extensions, multi, startIn })
            if (!files) return
            if (setValue) setValue(files)
        })()

    }, [root, extensions, fileType, label, multi, setValue, startIn])

    return <Field label={label} error={errorCheck()}>
        <div className={styles.uploadZone} onClick={onClick}>
            <EditorIcon className={className} path={COMMON_ICONS.upload} label={label} />
        </div>
    </Field>
}
