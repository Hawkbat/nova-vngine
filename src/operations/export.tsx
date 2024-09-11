import * as zip from '@zip.js/zip.js'

import { closeDialog, openCustomDialog } from '../components/common/Dialog'
import { EditorIcon } from '../components/common/EditorIcon'
import { COMMON_ICONS } from '../components/common/Icons'
import { projectStore } from '../store/project'
import { DEFAULT_PROJECT_FILENAME } from '../types/platform'
import { ENTITY_TYPES, getProjectEntityKey } from '../types/project'
import { immSet } from '../utils/imm'
import { createSimpleStore, type SimpleStore, useStore } from '../utils/store'
import { getEntityAssets } from './project'
import { getProjectStorage } from './storage'

type ProgressState = {
    totalCount: number
    completedCount: number
}

type ProgressStore = SimpleStore<ProgressState>

function ProgressDialogContent({ store }: { store: ProgressStore }) {
    const [getStore] = useStore(store)
    return <div>
        <EditorIcon path={COMMON_ICONS.loading} anim='spin' />
        Collected {getStore().completedCount} / {getStore().totalCount} Assets...
    </div>
}

export async function exportProjectToZip() {
    const zipFileWriter = new zip.BlobWriter()
    const zipWriter = new zip.ZipWriter(zipFileWriter)

    const progressStore = createSimpleStore<ProgressState>({ totalCount: 0, completedCount: 0 })

    const abortController = new AbortController()
    const abort = abortController.signal

    const writeJson = async (filename: string, obj: unknown) => {
        progressStore.setValue(s => immSet(s, 'totalCount', s.totalCount + 1))
        abort.throwIfAborted()
        const reader = new zip.TextReader(JSON.stringify(await obj))
        abort.throwIfAborted()
        await zipWriter.add(filename, reader)
        progressStore.setValue(s => immSet(s, 'completedCount', s.completedCount + 1))
        abort.throwIfAborted()
    }

    const writeArrayBuffer = async (filename: string, buffer: ArrayBuffer | Promise<ArrayBuffer>) => {
        progressStore.setValue(s => immSet(s, 'totalCount', s.totalCount + 1))
        abort.throwIfAborted()
        const reader = new zip.BlobReader(new Blob([await buffer]))
        abort.throwIfAborted()
        await zipWriter.add(filename, reader)
        progressStore.setValue(s => immSet(s, 'completedCount', s.completedCount + 1))
        abort.throwIfAborted()
    }

    const { root, storage } = getProjectStorage()

    const assets = ENTITY_TYPES.flatMap(t =>projectStore.getValue()[getProjectEntityKey(t)].flatMap(e => getEntityAssets(t, e)))

    const dialogPromise = openCustomDialog(<>Exporting ZIP</>, <ProgressDialogContent store={progressStore} />, { cancel: { content: <>Cancel</> } })
    void dialogPromise.then(() => {
        abortController.abort()
    })

    try {
        await Promise.all([
            writeJson(DEFAULT_PROJECT_FILENAME, projectStore.getValue()),
            ...assets.map(async a => writeArrayBuffer(a.path, storage.loadBinary(root, a.path))),
        ])
        await zipWriter.close()
        const zipFileBlob = await zipFileWriter.getData()
        return zipFileBlob
    } finally {
        closeDialog('error')
    }
}

export function downloadBlob(blob: Blob, name: string) {
    const blobUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = name
    document.body.appendChild(link)
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
    document.body.removeChild(link)
}
