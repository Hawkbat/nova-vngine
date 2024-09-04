import { useCallback } from 'react'

import { useAsset } from '../../store/assets'
import { useProjectStorage } from '../../store/operations'
import type { AssetDefinition } from '../../types/project'
import { AUDIO_EXTENSIONS, getMimeType } from '../../utils/media'
import { EditorIcon } from './EditorIcon'
import type { FieldProps } from './Field'
import { Field } from './Field'
import { COMMON_ICONS } from './Icons'
import type { UploadCallback } from './UploadZone'
import { UploadZone } from './UploadZone'

export const AudioField = ({ className, label, value, setValue, validate, targetPath }: FieldProps<AssetDefinition | null> & { targetPath: string }) => {
    const { getRoot, storage } = useProjectStorage()
    const getAudioSrc = useAsset(value, false)

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

    return <Field label={label} error={errorCheck()}>
        {value ? <>
            {getAudioSrc() ? <audio src={getAudioSrc() ?? undefined} controls /> : <span>Loading...</span>}
            <EditorIcon path={COMMON_ICONS.deleteItem} label='Delete Audio' onClick={onDelete} />
        </> : <>
            <UploadZone fileType='Audio File' extensions={AUDIO_EXTENSIONS} title='Upload Audio File' onUpload={onUpload} />
        </>}
    </Field>
}
