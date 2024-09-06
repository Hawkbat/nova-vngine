import { useCallback, useEffect } from 'react'

import { getCurrentPlayerState, userPlayStory } from '../../operations/player'
import { gamePlayerStore } from '../../store/player'
import { viewStateStore } from '../../store/viewstate'
import { useLatest } from '../../utils/hooks'
import { immAppend, immSet } from '../../utils/imm'
import { useStore } from '../../utils/store'
import { ScenePlayer } from './ScenePlayer'

import styles from './GamePlayer.module.css'

export const GamePlayer = () => {
    const [getState, setState] = useStore(gamePlayerStore)
    const [evalState, sceneState] = getCurrentPlayerState(getState())

    const getLatestStep = useLatest(evalState.stoppedAt)

    useEffect(() => {
        const storyID = viewStateStore.getValue().scopes.story
        if (storyID) userPlayStory(storyID)
        else viewStateStore.setValue(s => immSet(s, 'editor', null))
    }, [])

    const onAdvance = useCallback(() => {
            setState(s => {
                const step = getLatestStep()
                if (!step) return s
                return immSet(s, 'stopAfter', step.id)
            })
    }, [getLatestStep, setState])

    const onSelectOption = useCallback((index: number) => {
        setState(s => {
            const step = getLatestStep()
            if (!step) return s
            if (step.type === 'decision') {
                if (index < 0 || index >= step.options.length) return s
                s = immSet(s, 'actions', immAppend(s.actions, { type: 'decision', stepID: step.id, index }))
                s = immSet(s, 'stopAfter', step.id)
            }
            return s
        })
    }, [getLatestStep, setState])

    const onSubmitPrompt = useCallback((value: unknown) => {
        setState(s => {
            const step = getLatestStep()
            if (!step) return s
            if (step.type === 'prompt') {
                s = immSet(s, 'actions', immAppend(s.actions, { type: 'prompt', stepID: step.id, value }))
                s = immSet(s, 'stopAfter', step.id)
            }
            return s
        })
    }, [getLatestStep, setState])

    return <div className={styles.player}>
        <ScenePlayer state={sceneState} onAdvance={onAdvance} onSelectOption={onSelectOption} onSubmitPrompt={onSubmitPrompt} />
    </div>
}
