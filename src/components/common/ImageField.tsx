import { useCallback, useState } from 'react'

import { useAsset } from '../../store/assets'
import { useProjectStorage } from '../../store/operations'
import type { AssetDefinition } from '../../types/project'
import { classes } from '../../utils/display'
import { throwIfNull } from '../../utils/guard'
import { getMimeType, IMAGE_EXTENSIONS } from '../../utils/media'
import { EditorIcon } from './EditorIcon'
import type { FieldProps } from './Field'
import { Field } from './Field'
import { COMMON_ICONS } from './Icons'
import { ImagePreview } from './ImagePreview'
import type { UploadCallback } from './UploadZone'
import { UploadZone } from './UploadZone'

import styles from './ImageField.module.css'

export const ImageField = ({ className, label, value, setValue, validate, targetPath }: FieldProps<AssetDefinition | null> & { targetPath: string }) => {
    const { getRoot, storage } = useProjectStorage()
    const getImgSrc = useAsset(value, false)
    const getThumbImgSrc = useAsset(value, true)
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
            {getThumbImgSrc() ? <>
                <img className={classes(styles.preview, className)} src={getThumbImgSrc() ?? undefined} onClick={onPreview} />
                <ImagePreview open={previewOpen} src={throwIfNull(getImgSrc() ?? getThumbImgSrc())} onClose={() => setPreviewOpen(false)} />
            </> : <span>Loading...</span>}
            <EditorIcon path={COMMON_ICONS.deleteItem} label='Delete Image' onClick={onDelete} />
        </> : <>
            <UploadZone fileType='Image File' extensions={IMAGE_EXTENSIONS} title='Upload Image File' onUpload={onUpload} />
        </>}
    </Field>
}
