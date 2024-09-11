import { Fragment, useCallback, useEffect, useState } from 'react'

import { getCurrentPlayerState, userPlayStory } from '../../operations/player'
import { getEntityByID, getEntityDisplayName } from '../../operations/project'
import { useViewStateTab } from '../../operations/viewState'
import { gamePlayerStore } from '../../store/player'
import { projectStore } from '../../store/project'
import { settingsStore } from '../../store/settings'
import { type AnyExprValue, type ExprContext, resolveExprAs } from '../../types/expressions'
import { type CharacterPlayerEvalState, type GamePlayerEvalState, type GameSaveState, prettyPrintActions } from '../../types/player'
import type { CharacterID, StoryID, VariableID } from '../../types/project'
import { arrayJoin } from '../../utils/array'
import { classes } from '../../utils/display'
import { throwIfNull } from '../../utils/guard'
import { useLatest } from '../../utils/hooks'
import { immAppend, immSet } from '../../utils/imm'
import { useSelector, useStore } from '../../utils/store'
import { EditorIcon } from '../common/EditorIcon'
import { COMMON_ICONS, EXPR_ICONS } from '../common/Icons'
import { ParticleField } from '../common/ParticleField'
import { TransitionGroup, useTransitionAnimationRef } from '../common/TransitionGroup'
import { PlayerIcon } from './PlayerIcon'
import { ScenePlayer } from './ScenePlayer'

import styles from './GamePlayer.module.css'

const DebuggerVariable = ({ variableID, value, exprContext }: { variableID: VariableID, value: AnyExprValue, exprContext: ExprContext }) => {
    const variable = getEntityByID('variable', variableID)
    const getDisplayValue = (value: AnyExprValue): React.ReactNode => {
        switch (value.type) {
            case 'boolean': {
                if (variable?.type === 'flag') {
                    if (value.value && variable.setValueLabel.type !== 'unset') {
                        return resolveExprAs(variable.setValueLabel, 'string', exprContext).value
                    }
                    if (!value.value && variable.unsetValueLabel.type !== 'unset') {
                        return resolveExprAs(variable.unsetValueLabel, 'string', exprContext).value
                    }
                }
                return value.value ? 'True' : 'False'
            }
            case 'number': {
                const s = String(value.value)
                if (!s.includes('.')) return `${s}.0`
                return s
            }
            case 'integer': return String(value.value)
            case 'string': return JSON.stringify(value.value)
            case 'story':
            case 'chapter':
            case 'scene':
            case 'character':
            case 'portrait':
            case 'backdrop':
            case 'song':
            case 'sound':
            case 'macro':
            case 'variable':
                return getEntityDisplayName(value.type, getEntityByID(value.type, value.value), true)
            case 'location': return String(value.value)
            case 'list': {
                return arrayJoin(value.value.map(v => getDisplayValue(v)), <>, </>)
            }
            default: return <>{JSON.stringify(value)}</>
        }
    }
    return <>
        <b>{variable ? getEntityDisplayName('variable', variable, false) : variableID}</b>
        <i>{getDisplayValue(value)}</i>
    </>
}

const GameSceneDebugger = ({ saveState, evalState, exprContext }: { saveState: GameSaveState, evalState: GamePlayerEvalState, exprContext: ExprContext }) => {
    const [open, setOpen] = useState(false)

    return <div className={classes(styles.debugger, open && styles.open)}>
        <EditorIcon path={EXPR_ICONS.variable} onClick={() => setOpen(v => !v)} />
        <div className={styles.debuggerVariableList}>
            <b>Seed</b><i>{evalState.randState[1]}</i>
            <b>Story</b><i>{evalState.story?.id ? getEntityDisplayName('story', getEntityByID('story', evalState.story.id), false) : 'None'}</i>
            {evalState.story ? <div className={styles.debuggerVariableList}>
                {(Object.entries(evalState.story.variables) as [VariableID, AnyExprValue][]).map(([k, v]) => <DebuggerVariable key={k} variableID={k} value={v} exprContext={exprContext} />)}
                <b>Chapter</b><i>{evalState.story.chapter?.id ? getEntityDisplayName('chapter', getEntityByID('chapter', evalState.story.chapter.id), false) : 'None'}</i>
                {evalState.story.chapter ? <div className={styles.debuggerVariableList}>
                    {(Object.entries(evalState.story.chapter.variables) as [VariableID, AnyExprValue][]).map(([k, v]) => <DebuggerVariable key={k} variableID={k} value={v} exprContext={exprContext} />)}
                    <b>Scene</b><i>{evalState.story.chapter.scene?.id ? getEntityDisplayName('scene', getEntityByID('scene', evalState.story.chapter.scene.id), false) : 'None'}</i>
                    {evalState.story.chapter.scene ? <div className={styles.debuggerVariableList}>
                        {(Object.entries(evalState.story.chapter.scene.variables) as [VariableID, AnyExprValue][]).map(([k, v]) => <DebuggerVariable key={k} variableID={k} value={v} exprContext={exprContext} />)}
                    </div> : null}
                </div> : null}
                <b>Characters</b><i></i>
                {(Object.entries(evalState.story.characters) as [CharacterID, CharacterPlayerEvalState][]).map(([k, v]) => <Fragment key={k}>
                    <b>{getEntityDisplayName('character', getEntityByID('character', k), false)}</b><i></i>
                    <div className={styles.debuggerVariableList}>
                        {(Object.entries(v.variables) as [VariableID, AnyExprValue][]).map(([k, v]) => <DebuggerVariable key={k} variableID={k} value={v} exprContext={exprContext} />)}
                    </div>
                </Fragment>)}
            </div> : null}
            <b>Macros</b><i></i>
                {evalState.macros.map(m => <Fragment key={m.id}>
                    <b>{getEntityDisplayName('macro', getEntityByID('macro', m.id), false)}</b><i></i>
                    <div className={styles.debuggerVariableList}>
                        {(Object.entries(m.variables) as [VariableID, AnyExprValue][]).map(([k, v]) => <DebuggerVariable key={k} variableID={k} value={v} exprContext={exprContext} />)}
                    </div>
                </Fragment>)}
        </div>
        <div className={styles.debuggerActionList}>
            <b>Actions</b>
            {prettyPrintActions(saveState.actions).map((a, i) => <span key={i}>{a}</span>)}
        </div>
    </div>
}

const GameScenePlayer = ({ setScreen }: { setScreen: (screen: MenuScreen) => void }) => {
    const [fastForward, setFastForward] = useState(false)
    const [getGameState, setGameState] = useStore(gamePlayerStore)
    const getState = useCallback(() => throwIfNull(getGameState().currentSave), [getGameState])
    const setState = useCallback((setter: (value: GameSaveState) => GameSaveState) => {
        setGameState(s => immSet(s, 'currentSave', setter(throwIfNull(s.currentSave))))
    }, [setGameState])
    const getSettings = useSelector(settingsStore, s => s.scenePlayerSettings)

    const [evalState, sceneState, exprContext] = getCurrentPlayerState(getState(), getSettings(), fastForward)

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
            if (!step || step.type !== 'decision') return s
            if (index < 0 || index >= step.options.length) return s
            s = immSet(s, 'actions', immAppend(s.actions, { type: 'decision', stepID: step.id, index }))
            s = immSet(s, 'stopAfter', step.id)
            return s
        })
    }, [getLatestStep, setState])

    const onSubmitPrompt = useCallback((value: string) => {
        setState(s => {
            const step = getLatestStep()
            if (!step || step.type !== 'prompt') return s
            s = immSet(s, 'actions', immAppend(s.actions, { type: 'prompt', stepID: step.id, value }))
            s = immSet(s, 'stopAfter', step.id)
            return s
        })
    }, [getLatestStep, setState])

    const onRandomizePrompt = useCallback(() => {
        setState(s => {
            const step = getLatestStep()
            if (!step || step.type !== 'prompt') return s
            s = immSet(s, 'actions', immAppend(s.actions, { type: 'randomize', stepID: step.id }))
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
        <ScenePlayer state={sceneState} onAdvance={onAdvance} onSelectOption={onSelectOption} onSubmitPrompt={onSubmitPrompt} onRandomizePrompt={onRandomizePrompt} />
        <GameSceneDebugger saveState={getState()} evalState={evalState} exprContext={exprContext} />
        <div className={styles.playerButtons}>
            <PlayerIcon path={COMMON_ICONS.fastForward} label='Fast-Forward' active={fastForward} onClick={() => setFastForward(v => !v)} />
            <PlayerIcon path={COMMON_ICONS.restart} label='Rewind' onClick={onRewind} />
            <PlayerIcon path={COMMON_ICONS.menu} label='Menu' onClick={() => setScreen('main')} />
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
    const onRewind = useCallback(() => {
        gamePlayerStore.setValue(s => immSet(s, 'currentSave', immSet(throwIfNull(s.currentSave), 'actions', throwIfNull(s.currentSave).actions.slice(0, -1))))
        setScreen('play')
    }, [setScreen])
    const onMainMenu = useCallback(() => {
        setScreen('main')
    }, [setScreen])
    return <Menu header='The End'>
        <MenuButton onClick={onRewind}>Rewind</MenuButton>
        <MenuButton onClick={onMainMenu}>Main Menu</MenuButton>
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
    const [, setTab] = useViewStateTab()
    const onContinue = useCallback(() => {
        setScreen('play')
    }, [setScreen])
    const onNewGame = useCallback(() => {
        setScreen('stories')
    }, [setScreen])
    const onLoadGame = useCallback(() => {
        setScreen('saves')
    }, [setScreen])
    const onSettings = useCallback(() => {
        setTab('settings')
    }, [setTab])
    return <Menu header={getProjectName()}>
        <MenuButton disabled={!getCurrentSave()} onClick={onContinue}>Continue</MenuButton>
        <MenuButton onClick={onNewGame}>New Game</MenuButton>
        <MenuButton disabled onClick={onLoadGame}>Load Game</MenuButton>
        <MenuButton onClick={onSettings}>Settings</MenuButton>
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
