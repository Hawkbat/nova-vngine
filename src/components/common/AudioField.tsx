import { useCallback } from 'react'
import type { FieldProps } from './Field'
import { Field } from './Field'
import type { UploadCallback } from './UploadZone'
import { UploadZone } from './UploadZone'
import { useProjectStorage } from '../../store/operations'
import { useAsset } from '../../store/assets'
import { EditorIcon } from './EditorIcon'
import { COMMON_ICONS } from './Icons'
import type { AssetDefinition } from '../../types/project'
import { AUDIO_EXTENSIONS, getMimeType } from '../../utils/media'

export const AudioField = ({ className, label, value, setValue, validate, targetPath }: FieldProps<AssetDefinition | null> & { targetPath: string }) => {
    const { root, storage } = useProjectStorage()
    const audioSrc = useAsset(value)

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

    return <Field label={label} error={errorCheck()}>
        {value ? <>
            {audioSrc ? <audio src={audioSrc} controls /> : <span>Loading...</span>}
            <EditorIcon path={COMMON_ICONS.deleteItem} label='Delete Audio' onClick={onDelete} />
        </> : <>
            <UploadZone fileType='Audio File' extensions={AUDIO_EXTENSIONS} title='Upload Audio File' onUpload={onUpload} />
        </>}
    </Field>
}
