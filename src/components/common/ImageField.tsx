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
import { throwIfNull } from '../../utils/guard'

export const ImageField = ({ className, label, value, setValue, validate, targetPath }: FieldProps<AssetDefinition | null> & { targetPath: string }) => {
    const { getRoot, storage } = useProjectStorage()
    const getImgSrc = useAsset(value)
    const [previewOpen, setPreviewOpen] = useState(false)

    const errorCheck = useCallback(() => {
        if (validate) return validate(value)
        return null
    }, [value, validate])

    const onUpload: UploadCallback = useCallback(files => {
        const [file] = files
        if (!file) return
        void (async () => {
            const buffer = await file.binary()
            if (!storage.storeBinary) throw new Error(`Storage ${storage.type} does not support saving binary files`)
            const mimeType = getMimeType(file.name)
            if (!mimeType) throw new Error('File did not have a recognized file extension')
            const path = targetPath
            await storage.storeBinary(getRoot(), path, buffer)
            setValue?.({ mimeType, path })
        })()
    }, [targetPath, getRoot, setValue, storage])

    const onDelete = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        setValue?.(null)
    }, [setValue])

    const onPreview = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        setPreviewOpen(true)
    }, [])

    return <Field label={label} error={errorCheck()}>
        {value ? <>
            {getImgSrc() ? <>
                <img className={classes(styles.preview, className)} src={getImgSrc() ?? undefined} onClick={onPreview} />
                <ImagePreview open={previewOpen} src={throwIfNull(getImgSrc())} onClose={() => setPreviewOpen(false)} />
            </> : <span>Loading...</span>}
            <EditorIcon path={COMMON_ICONS.deleteItem} label='Delete Image' onClick={onDelete} />
        </> : <>
            <UploadZone fileType='Image File' extensions={IMAGE_EXTENSIONS} title='Upload Image File' onUpload={onUpload} />
        </>}
    </Field>
}
