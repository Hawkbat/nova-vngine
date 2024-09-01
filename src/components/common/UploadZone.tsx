import { useCallback } from 'react'

import { useProjectStorage } from '../../store/operations'
import type { StorageFileResult } from '../../types/storage'
import { classes } from '../../utils/display'
import { useDrop } from '../../utils/hooks'
import { EditorIcon } from './EditorIcon'
import { COMMON_ICONS } from './Icons'

import styles from './UploadZone.module.css'

export type UploadCallback = (files: StorageFileResult[]) => void

export const UploadZone = ({ className, title, fileType, extensions, multi, startIn, onUpload }: {
    className?: string
    title: string
    fileType: string
    extensions: string[]
    multi?: boolean
    startIn?: string
    onUpload: UploadCallback
}) => {
    const { getRoot, storage } = useProjectStorage()

    const [dropProps, dropOver] = useDrop('copy', useCallback(values => {
        if (values.type !== 'files') return
        onUpload(values.files.map(f => ({
            type: 'file',
            name: f.name,
            path: f.name,
            async text() {
                return await f.text()
            },
            async binary() {
                return await f.arrayBuffer()
            },
        })))
    }, [onUpload]))

    const enablePicker = storage.type === 'neutralino' || storage.type === 'chromium'
    const enableDrop = enablePicker || storage.type === 'browser'

    const onClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()

        void (async () => {
            const files = await storage.pickFiles?.(getRoot(), { title, fileType, extensions, multi, startIn })
            if (!files) return
            onUpload(files)
        })()
    }, [getRoot, storage, title, fileType, extensions, multi, startIn, onUpload])

    return <div className={classes(styles.uploadZone, { [styles.dropOver ?? '']: dropOver, [styles.picker ?? '']: enablePicker, [styles.dropSite ?? '']: enableDrop })} onClick={enablePicker ? onClick : undefined} {...(enableDrop ? dropProps : {})}>
        <EditorIcon className={className} path={COMMON_ICONS.upload} label={enablePicker && enableDrop ? `Upload or Drop ${fileType}` : (enablePicker as boolean) ? `Upload ${fileType}` : enableDrop ? `Drop ${fileType}` : undefined} showLabel />
    </div>
}
