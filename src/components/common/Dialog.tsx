import { createExposedPromise, ExposedPromise } from "../../utils/async"
import { createPortal } from "react-dom"
import styles from './Dialog.module.css'
import { EditorIcon } from "./EditorIcon"
import { createSimpleStore, useSelector, useStore } from "../../utils/store"
import { immAppend, immRemoveAt, immSet } from "../../utils/imm"
import { mdiAlert } from "@mdi/js"
import { hintTypeTuple } from "../../utils/types"
import { EditorButton, EditorButtonGroup } from "./EditorButton"

export interface DialogChoice {
    content: React.ReactNode
    icon?: string
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

export function openCustomDialog<T extends string>(title: React.ReactNode, content: React.ReactNode, choices: Record<T, DialogChoice>): Promise<T> {
    const promise = createExposedPromise<string>()
    const newState: DialogState = {
        title,
        content,
        choices,
        promise,
    }
    dialogStore.setValue(s => immSet(s, 'states', immAppend(s.states, newState)))
    return promise.promise as Promise<T>
}

export function openDialog<T extends string>(title: string, message: string, choices: Record<T, string>): Promise<T> {
    return openCustomDialog(<><EditorIcon path={mdiAlert} label={title} /> {title}</>, <>{message}</>, Object.fromEntries(Object.entries(choices).map(([k, v]) => hintTypeTuple(k, { content: <>{v}</> }))) as Record<T, DialogChoice>)
}

export function useIsDialogOpen() {
    const [isDialogOpen] = useSelector(dialogStore, s => !!s.states.length)
    return isDialogOpen
}

export const Dialog = () => {
    const [store, setStore] = useStore(dialogStore)
    const currentState = store.states.length ? store.states[0] : null

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
                <EditorButtonGroup>
                    {Object.entries(currentState.choices).map(([k, v]) => <EditorButton key={k} onClick={() => onChoiceClicked(k)}>
                        {v.icon ? <EditorIcon path={v.icon} /> : null}
                        {v.content}
                    </EditorButton>)}                    
                </EditorButtonGroup>
            </div>
        </div>, document.body) : null}
    </>
}
