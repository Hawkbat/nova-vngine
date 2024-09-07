import { useCallback, useEffect, useState } from 'react'

import { getCurrentPlayerState, userPlayStory } from '../../operations/player'
import { getEntityDisplayName } from '../../operations/project'
import { gamePlayerStore } from '../../store/player'
import { projectStore } from '../../store/project'
import { settingsStore } from '../../store/settings'
import type { GameSaveState } from '../../types/player'
import type { StoryID } from '../../types/project'
import { classes } from '../../utils/display'
import { throwIfNull } from '../../utils/guard'
import { useLatest } from '../../utils/hooks'
import { immAppend, immSet } from '../../utils/imm'
import { useSelector, useStore } from '../../utils/store'
import { COMMON_ICONS } from '../common/Icons'
import { ParticleField } from '../common/ParticleField'
import { TransitionGroup, useTransitionAnimationRef } from '../common/TransitionGroup'
import { PlayerIcon } from './PlayerIcon'
import { ScenePlayer } from './ScenePlayer'

import styles from './GamePlayer.module.css'

const GameScenePlayer = ({ setScreen }: { setScreen: (screen: MenuScreen) => void }) => {
    const [fastForward, setFastForward] = useState(false)
    const [getGameState, setGameState] = useStore(gamePlayerStore)
    const getState = useCallback(() => throwIfNull(getGameState().currentSave), [getGameState])
    const setState = useCallback((setter: (value: GameSaveState) => GameSaveState) => {
        setGameState(s => immSet(s, 'currentSave', setter(throwIfNull(s.currentSave))))
    }, [setGameState])
    const getSettings = useSelector(settingsStore, s => s.scenePlayerSettings)

    const [evalState, sceneState] = getCurrentPlayerState(getState(), getSettings(), fastForward)

    const getLatestStep = useLatest(evalState.stoppedAt)

    const onRewind = useCallback(() => {
        setGameState(s => immSet(s, 'currentSave', immSet(throwIfNull(s.currentSave), 'actions', throwIfNull(s.currentSave).actions.slice(0, -1))))
    }, [setGameState])

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

    useEffect(() => {
        if (!evalState.story) {
            setScreen('gameover')
        }
    }, [evalState.story, setScreen])

    const animRef = useTransitionAnimationRef(true, {
        in: [{ opacity: 0 }, { opacity: 1 }],
        inT: { duration: 200 },
        out: [{ opacity: 1 }, { opacity: 0 }],
        outT: { duration: 200 },
    })

    return <div ref={animRef} className={styles.player}>
        <ScenePlayer state={sceneState} onAdvance={onAdvance} onSelectOption={onSelectOption} onSubmitPrompt={onSubmitPrompt} />
        <div className={styles.playerButtons}>
            <PlayerIcon path={COMMON_ICONS.fastForward} label='Fast-Forward' active={fastForward} onClick={() => setFastForward(v => !v)} />
            <PlayerIcon path={COMMON_ICONS.restart} label='Rewind' onClick={onRewind} />
        </div>
    </div>
}

const MenuButton = ({ disabled, onClick, children }: {
    disabled?: boolean
    onClick: (e: React.MouseEvent) => void
    children: React.ReactNode
}) => {

    const onButtonClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        if (disabled) return
        onClick(e)
    }, [onClick, disabled])

    return <div className={classes(styles.menuButton, { [styles.disabled ?? '']: disabled })} onClick={onButtonClick}>
        {children}
    </div>
}

const MenuHeader = ({ children }: { children: React.ReactNode }) => {
    return <div className={styles.menuHeader}>
        {children}
    </div>
}

const Menu = ({ header, children }: { header: string, children: React.ReactNode }) => {
    const animRef = useTransitionAnimationRef(true, {
        in: [{ opacity: 0, transform: 'translateX(-2em)' }, { opacity: 1, transform: 'translateX(0em)' }],
        inT: { duration: 200 },
        out: [{ opacity: 1, transform: 'translateX(0em)' }, { opacity: 0, transform: 'translateX(-2em)' }],
        outT: { duration: 200 },
    })
    return <div ref={animRef} className={styles.menu}>
        {header ? <MenuHeader>{header}</MenuHeader> : null}
        <div className={styles.menuContent}>
            {children}
        </div>
    </div>
}

const GameOverMenu = ({ setScreen }: { setScreen: (screen: MenuScreen) => void }) => {
    const [getGameState, setGameState] = useStore(gamePlayerStore)
    const onRewind = useCallback(() => {
        setGameState(s => immSet(s, 'currentSave', immSet(throwIfNull(s.currentSave), 'actions', throwIfNull(s.currentSave).actions.slice(0, -1))))
        setScreen('play')
    }, [setGameState, setScreen])
    const onRestart = useCallback(() => {
        userPlayStory(throwIfNull(getGameState().currentSave).storyID)
        setScreen('play')
    }, [getGameState, setScreen])
    return <Menu header='The End'>
        <MenuButton onClick={onRewind}>Rewind</MenuButton>
        <MenuButton onClick={onRestart}>Restart</MenuButton>
    </Menu>
}

const StoryMenu = ({ setScreen }: { setScreen: (screen: MenuScreen) => void }) => {
    const getStories = useSelector(projectStore, s => s.stories)
    const onSelectStory = useCallback((storyID: StoryID) => {
        userPlayStory(storyID)
        setScreen('play')
    }, [setScreen])
    return <Menu header='Choose a Story'>
        {getStories().map(s => <MenuButton key={s.id} onClick={() => onSelectStory(s.id)}>{getEntityDisplayName('story', s, false)}</MenuButton>)}
    </Menu>
}

const SaveMenu = ({ setScreen }: { setScreen: (screen: MenuScreen) => void }) => {
    return <Menu header='Choose Saved Game'>
        <></>
    </Menu>
}

const MainMenu = ({ setScreen }: { setScreen: (screen: MenuScreen) => void }) => {
    const getCurrentSave = useSelector(gamePlayerStore, s => s.currentSave)
    const getProjectName = useSelector(projectStore, s => s.name)
    const onContinue = useCallback(() => {
        setScreen('play')
    }, [setScreen])
    const onNewGame = useCallback(() => {
        setScreen('stories')
    }, [setScreen])
    const onLoadGame = useCallback(() => {
        setScreen('saves')
    }, [setScreen])
    return <Menu header={getProjectName()}>
        <MenuButton disabled={!getCurrentSave()} onClick={onContinue}>Continue</MenuButton>
        <MenuButton onClick={onNewGame}>New Game</MenuButton>
        <MenuButton disabled onClick={onLoadGame}>Load Game</MenuButton>
    </Menu>
}

type MenuScreen = 'main' | 'stories' | 'saves' | 'play' | 'gameover'

export const GamePlayer = () => {
    const getEnableParticles = useSelector(settingsStore, s => s.menuAnimationEnabled)
    const [screen, setScreen] = useState<MenuScreen>('main')
    return <div className={styles.gamePlayer}>
        {getEnableParticles() ? <ParticleField /> : null}
        <TransitionGroup values={[screen]} getKey={s => s}>
            {screen => <>
                {screen === 'main' ? <MainMenu setScreen={setScreen} /> : null}
                {screen === 'saves' ? <SaveMenu setScreen={setScreen} /> : null}
                {screen === 'stories' ? <StoryMenu setScreen={setScreen} /> : null}
                {screen === 'play' ? <GameScenePlayer setScreen={setScreen} /> : null}
                {screen === 'gameover' ? <GameOverMenu setScreen={setScreen} /> : null}
            </>}
        </TransitionGroup>
    </div>
}
