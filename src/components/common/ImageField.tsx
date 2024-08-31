import { useCallback, useState } from 'react'
import type { FieldProps } from './Field'
import { Field } from './Field'
import type { UploadCallback } from './UploadZone'
import { UploadZone } from './UploadZone'
import { useProjectStorage } from '../../store/operations'
import { useAsset } from '../../store/assets'
import styles from './ImageField.module.css'
import { EditorIcon } from './EditorIcon'
import { COMMON_ICONS } from './Icons'
import { classes } from '../../utils/display'
import type { AssetDefinition } from '../../types/project'
import { getMimeType, IMAGE_EXTENSIONS } from '../../utils/media'
import { ImagePreview } from './ImagePreview'

export const ImageField = ({ className, label, value, setValue, validate, targetPath }: FieldProps<AssetDefinition | null> & { targetPath: string }) => {
    const { root, storage } = useProjectStorage()
    const imgSrc = useAsset(value)
    const [previewOpen, setPreviewOpen] = useState(false)

    const errorCheck = useCallback(() => {
        if (validate) return validate(value)
        return null
    }, [value, validate])

    const onUpload: UploadCallback = useCallback(files => {
        if (files.length === 1) {
            const [file] = files
            void (async () => {
                const buffer = await file.binary()
                if (!storage.storeBinary) throw new Error(`Storage ${storage.type} does not support saving binary files`)
                const mimeType = getMimeType(file.name)
                if (!mimeType) throw new Error('File did not have a recognized file extension')
                const path = targetPath
                await storage.storeBinary(root, path, buffer)
                setValue?.({ mimeType, path })
            })()
        }
    }, [targetPath, root, setValue, storage])

    const onDelete = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        setValue?.(null)
    }, [setValue])

    const onPreview = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        setPreviewOpen(true)
    }, [])

    return <Field label={label} error={errorCheck()}>
        {imgSrc ? <>
            <img className={classes(styles.preview, className)} src={imgSrc} onClick={onPreview} />
            <EditorIcon path={COMMON_ICONS.deleteItem} label='Delete Image' onClick={onDelete} />
            <ImagePreview open={previewOpen} src={imgSrc} onClose={() => setPreviewOpen(false)} />
        </> : <>
            <UploadZone fileType='Image File' extensions={IMAGE_EXTENSIONS} title='Upload Image File' onUpload={onUpload} />
        </>}
    </Field>
}
