import { createPortal } from 'react-dom'

import { arrayHead } from '../../utils/array'
import type { ExposedPromise } from '../../utils/async'
import { createExposedPromise } from '../../utils/async'
import { immAppend, immRemoveAt, immSet } from '../../utils/imm'
import { createSimpleStore, useSelector, useStore } from '../../utils/store'
import { hintTuple } from '../../utils/types'
import { EditorButton, EditorButtonGroup } from './EditorButton'
import { EditorIcon } from './EditorIcon'
import { COMMON_ICONS } from './Icons'

import styles from './Dialog.module.css'

export interface DialogChoice {
    content: React.ReactNode
    icon?: string
    primary?: boolean
}

interface DialogState {
    title: React.ReactNode
    content: React.ReactNode
    choices: Record<string, DialogChoice>
    promise: ExposedPromise<string>
}

interface DialogStoreState {
    states: DialogState[]
}

const dialogStore = createSimpleStore<DialogStoreState>({ states: [] })

export async function openCustomDialog<T extends string>(title: React.ReactNode, content: React.ReactNode, choices: Record<T, DialogChoice>): Promise<T> {
    const promise = createExposedPromise<string>()
    const newState: DialogState = {
        title,
        content,
        choices,
        promise,
    }
    dialogStore.setValue(s => immSet(s, 'states', immAppend(s.states, newState)))
    return await promise.promise as T
}

export async function openDialog<T extends string>(title: string, message: string, choices: Record<T, string>): Promise<T> {
    return await openCustomDialog(<><EditorIcon path={COMMON_ICONS.warning} label={title} /> {title}</>, <>{message}</>, Object.fromEntries(Object.entries(choices).map(([k, v], i, arr) => hintTuple(k, { content: <>{v}</>, primary: i === arr.length - 1 ? true : undefined }))) as Record<T, DialogChoice>)
}

export function useIsDialogOpen() {
    const isDialogOpen = useSelector(dialogStore, s => !!s.states.length)
    return isDialogOpen
}

export const Dialog = () => {
    const [getStore, setStore] = useStore(dialogStore)
    const currentState = arrayHead(getStore().states)

    const onChoiceClicked = (k: string) => {
        currentState?.promise.resolve(k)
        setStore(s => immSet(s, 'states', immRemoveAt(s.states, 0)))
    }

    return <>
        {currentState ? createPortal(<div className={styles.backsplash}>
            <div className={styles.dialog}>
                <div className={styles.title}>
                    {currentState.title}
                </div>
                <div className={styles.content}>
                    {currentState.content}
                </div>
                <EditorButtonGroup side='right'>
                    {Object.entries(currentState.choices).map(([k, v]) => <EditorButton key={k} active={v.primary} onClick={() => onChoiceClicked(k)}>
                        {v.icon ? <EditorIcon path={v.icon} /> : null}
                        {v.content}
                    </EditorButton>)}
                </EditorButtonGroup>
            </div>
        </div>, document.body) : null}
    </>
}
