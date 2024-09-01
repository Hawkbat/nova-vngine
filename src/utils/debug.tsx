import { useRef, useState } from 'react'
import { mapStackTrace } from 'sourcemapped-stacktrace'

import { openCustomDialog } from '../components/common/Dialog'
import { EditorButton, EditorButtonGroup } from '../components/common/EditorButton'
import { EditorIcon } from '../components/common/EditorIcon'
import { COMMON_ICONS } from '../components/common/Icons'
import { platform } from '../platform/platform'

export async function mapStackTraceAsync(stack: string | undefined) {
    return await new Promise<string>((resolve, reject) => {
        try {
            if (!stack) return
            mapStackTrace(stack, result => resolve(result.join('\n')))
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            reject(err)
        }
    })
}

export async function openErrorDialog(err: unknown, ...additionalInfo: string[]) {
    const result = await openCustomDialog(<>Unexpected Error</>, <>
    <span>An unexpected error occurred. Please copy the error message below and send it to the developer (@hawkbar on Discord) with a description of what you were doing when the error happened.</span>
    <ErrorCodeBox>
        {err instanceof Error ? <>
            {err.name}: {err.message}
            {'\n'}{'\n'}
            {await mapStackTraceAsync(err.stack)}
        </> : <>{err}</>}
        {'\n'}
        {additionalInfo.join('\n')}
    </ErrorCodeBox>
    </>, { cancel: { content: 'Cancel' }, reload: { content: 'Reload App', primary: true } })
    if (result === 'reload') location.reload()
}

const ErrorCodeBox = ({ children }: { children: React.ReactNode }) => {
    const [copied, setCopied] = useState(false)
    const ref = useRef<HTMLElement>(null)
    const onClick = () => {
        if (ref.current) {
            const text = ref.current.textContent
            if (text) {
                void platform.writeToClipboard(text).then(() => {
                    setCopied(true)
                })
            }
        }
    }
    return <>
        <EditorButtonGroup side='left'>
            <EditorButton active onClick={onClick}>Copy</EditorButton>
            {copied ? <span><EditorIcon path={COMMON_ICONS.success} /> Copied to clipboard</span> : null}
        </EditorButtonGroup>
        <code ref={ref} style={{ maxHeight: '400px', overflow: 'auto', background: '#000' }}>
            {children}
        </code>
    </>
}
