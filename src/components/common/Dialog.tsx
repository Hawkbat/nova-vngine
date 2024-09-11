import { useCallback } from 'react'
import { createPortal } from 'react-dom'

import { arrayHead } from '../../utils/array'
import type { ExposedPromise } from '../../utils/async'
import { createExposedPromise } from '../../utils/async'
import { immAppend, immRemoveAt, immReplaceAt, immSet } from '../../utils/imm'
import { createSimpleStore, useSelector, useStore } from '../../utils/store'
import { hintTuple } from '../../utils/types'
import { EditorButton, EditorButtonGroup } from './EditorButton'
import { EditorIcon } from './EditorIcon'
import { COMMON_ICONS, STEP_ICONS } from './Icons'
import { StringField } from './StringField'

import styles from './Dialog.module.css'

export interface DialogChoice {
    content: React.ReactNode
    icon?: string
    primary?: boolean
}

type DialogState = {
    type: 'alert'
    title: React.ReactNode
    content: React.ReactNode
    choices: Record<string, DialogChoice>
    promise: ExposedPromise<string>
} | {
    type: 'prompt'
    title: React.ReactNode
    content: React.ReactNode
    submit: React.ReactNode
    cancel: React.ReactNode
    label: string
    value: string
    promise: ExposedPromise<string | null>
}

interface DialogStoreState {
    states: DialogState[]
}

const dialogStore = createSimpleStore<DialogStoreState>({ states: [] })

export async function openCustomDialog<T extends string>(title: React.ReactNode, content: React.ReactNode, choices: Record<T, DialogChoice>): Promise<T> {
    const promise = createExposedPromise<string>()
    const newState: DialogState = {
        type: 'alert',
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

export async function openCustomPromptDialog(title: React.ReactNode, content: React.ReactNode, label: string, initialValue: string, submit: React.ReactNode, cancel: React.ReactNode) {
    const promise = createExposedPromise<string | null>()
    const newState: DialogState = {
        type: 'prompt',
        title,
        content,
        label,
        value: initialValue,
        submit,
        cancel,
        promise,
    }
    dialogStore.setValue(s => immSet(s, 'states', immAppend(s.states, newState)))
    return await promise.promise
}

export async function openPromptDialog(title: string, message: string, label: string, initialValue: string, submit = 'Submit', cancel = 'Cancel') {
    return await openCustomPromptDialog(<><EditorIcon path={STEP_ICONS.prompt} label={title} /> {title}</>, <>{message}</>, label, initialValue, <>{submit}</>, <>{cancel}</>)
}

export function useIsDialogOpen() {
    const isDialogOpen = useSelector(dialogStore, s => !!s.states.length)
    return isDialogOpen
}

export function closeDialog(value: string): boolean {
    const s = arrayHead(dialogStore.getValue().states)
    if (s) {
        s.promise.resolve(value)
        dialogStore.setValue(s => immSet(s, 'states', immRemoveAt(s.states, 0)))
        return true
    }
    return false
}

export const Dialog = () => {
    const [getStore, setStore] = useStore(dialogStore)
    const currentState = arrayHead(getStore().states)

    const onChoiceClicked = useCallback((k: string) => {
        const currentState = arrayHead(getStore().states)
        if (currentState?.type === 'prompt') {
            if (k === 'submit') currentState.promise.resolve(currentState.value)
            else currentState.promise.resolve(null)
        } else {
            currentState?.promise.resolve(k)
        }
        setStore(s => immSet(s, 'states', immRemoveAt(s.states, 0)))
    }, [getStore, setStore])

    const setPromptValue = useCallback((value: string) => {
        setStore(s => {
            const stateHead = s.states[0]
            if (!stateHead || stateHead.type !== 'prompt') return s
            return immSet(s, 'states', immReplaceAt(s.states, 0, immSet(stateHead, 'value', value)))
        })
    }, [setStore])

    return <>
        {currentState ? createPortal(<div className={styles.backsplash}>
            <div className={styles.dialog}>
                <div className={styles.title}>
                    {currentState.title}
                </div>
                <div className={styles.content}>
                    {currentState.content}
                </div>
                {currentState.type === 'prompt' ? <>
                    <StringField label={currentState.label} value={currentState.value} setValue={setPromptValue} />
                </> : null}
                <EditorButtonGroup side='right'>
                    {currentState.type === 'alert' ? Object.entries(currentState.choices).map(([k, v]) => <EditorButton key={k} active={v.primary} onClick={() => onChoiceClicked(k)}>
                        {v.icon ? <EditorIcon path={v.icon} /> : null}
                        {v.content}
                    </EditorButton>) : <>
                        <EditorButton onClick={() => onChoiceClicked('cancel')}>{currentState.cancel}</EditorButton>
                        <EditorButton active onClick={() => onChoiceClicked('submit')}>{currentState.submit}</EditorButton>
                    </>}
                </EditorButtonGroup>
            </div>
        </div>, document.body) : null}
    </>
}
