import { gamePlayerStore } from '../store/player'
import { viewStateStore } from '../store/viewstate'
import { type AnyExprValue, resolveExpr, resolveExprAs } from '../types/expressions'
import type { GamePlayerActionOfType, GamePlayerActionType, GamePlayerEvalState, GameSaveState, ScenePlayerSettingsState } from '../types/player'
import { applyStepToScenePlayerState, getExprContext, getInitialGameSaveState, getInitialScenePlayerState, GoToSceneGamePlayerSignal, ReturnToStepGamePlayerSignal, StopGamePlayerSignal } from '../types/player'
import { type ChapterID, getVariableValueType, type MacroID, type SceneID, type StoryID } from '../types/project'
import type { AnyStep, StepID } from '../types/steps'
import { arrayHead } from '../utils/array'
import { throwIfNull } from '../utils/guard'
import { immSet } from '../utils/imm'
import { hintTuple } from '../utils/types'
import { getEntityByID } from './project'

export function userPlayStory(storyID: StoryID) {
    gamePlayerStore.setValue(s => immSet(s, 'currentSave', getInitialGameSaveState(storyID)))
    viewStateStore.setValue(s => immSet(s, 'currentTab', 'play'))
}

export function getCurrentPlayerState(gameState: GameSaveState, settings: ScenePlayerSettingsState, fastForward: boolean) {
    let evalState: GamePlayerEvalState = {
        randState: gameState.randState,
        story: null,
        macros: [],
        stoppedAt: null,
    }
    let sceneState = getInitialScenePlayerState(settings)
    const exprContext = getExprContext(() => evalState, setter => evalState = setter(evalState))
    const actions = [...gameState.actions]
    const stepHistory: AnyStep[] = []
    let stopNext = false

    const tryPopAction = <T extends GamePlayerActionType>(type: T, stepID: StepID): GamePlayerActionOfType<T> | null => {
        const head = arrayHead(actions)
        if (head?.type === type && head.stepID === stepID) {
            actions.shift()
            return head as GamePlayerActionOfType<T>
        }
        return null
    }

    const checkStop = (step: AnyStep) => {
        if (actions.length === 0 && step.id === gameState.stopAfter) {
            stopNext = true
        }
    }

    const processStory = (storyID: StoryID, chapterID?: ChapterID, sceneID?: SceneID) => {
        const story = throwIfNull(getEntityByID('story', storyID))
        if (evalState.story?.id !== storyID) {
            evalState.story = {
                id: story.id,
                variables: {},
                chapter: null,
                characters: {},
            }
        }
        try {
            processChapter(chapterID ?? throwIfNull(story.firstChapterID), sceneID)
            popStory()
        } catch (err) {
            if (err instanceof GoToSceneGamePlayerSignal) {
                const scene = throwIfNull(exprContext.resolvers.scene(err.sceneID))
                const chapter = throwIfNull(exprContext.resolvers.chapter(scene.chapterID))
                if (chapter.storyID === storyID) return processStory(storyID, chapter.id, scene.id)
            }
            throw err
        }
    }

    const processChapter = (chapterID: ChapterID, sceneID?: SceneID) => {
        const chapter = throwIfNull(getEntityByID('chapter', chapterID))
        if (evalState.story?.chapter?.id !== chapterID) {
            throwIfNull(evalState.story).chapter = {
                id: chapterID,
                variables: {},
                scene: null,
            }
        }
        try {
            processScene(sceneID ?? throwIfNull(chapter.firstSceneID))
            popChapter()
        } catch (err) {
            if (err instanceof GoToSceneGamePlayerSignal) {
                const scene = throwIfNull(exprContext.resolvers.scene(err.sceneID))
                if (scene.chapterID === chapterID) return processChapter(chapterID, scene.id)
            }
            throw err
        }
    }

    const processScene = (sceneID: SceneID) => {
        const scene = throwIfNull(getEntityByID('scene', sceneID))
        if (evalState.story?.chapter?.scene?.id !== scene.id) {
            throwIfNull(evalState.story?.chapter).scene = {
                id: scene.id,
                variables: {},
            }
        }
        sceneState = getInitialScenePlayerState(settings)
        try {
            processSteps(scene.steps)
            popScene()
        } catch (err) {
            if (err instanceof GoToSceneGamePlayerSignal) {
                if (err.sceneID === scene.id) return processScene(sceneID)
                popScene()
                throw err
            }
            throw err
        }
    }

    const processMacro = (macroID: MacroID) => {
        const macro = throwIfNull(getEntityByID('macro', macroID))
        evalState.macros.push({
            id: macro.id,
            variables: {},
        })
        try {
            processSteps(macro.steps)
            popMacro()
        } catch (err) {
            if (err instanceof GoToSceneGamePlayerSignal) {
                popMacro()
            }
            throw err
        }
    }

    const processStep = (step: AnyStep) => {
        stepHistory.push(step)
        sceneState = applyStepToScenePlayerState(sceneState, step, exprContext)
        switch (step.type) {
            case 'text':
            case 'narrate':
                if (actions.length === 0 && !fastForward && (!gameState.stopAfter || stopNext)) {
                    throw new StopGamePlayerSignal(step)
                }
                break
            case 'prompt':
            case 'decision': {
                if (actions.length === 0 && (!gameState.stopAfter || stopNext)) {
                    throw new StopGamePlayerSignal(step)
                }
                break
            }
            default: break
        }
        switch (step.type) {
            case 'prompt': {
                const action = tryPopAction('prompt', step.id)
                if (!action) throw new StopGamePlayerSignal(step)
                const variableID = resolveExprAs(step.variable, 'variable', exprContext).value
                const variable = throwIfNull(exprContext.resolvers.variable(variableID))
                const type = getVariableValueType(variable, exprContext)
                const value = { type, value: action.value } as AnyExprValue
                exprContext.variables.setValue(variableID, value)
                break
            }
            case 'decision': {
                const action = tryPopAction('decision', step.id)
                if (!action) throw new StopGamePlayerSignal(step)
                checkStop(step)
                processSteps(throwIfNull(step.options[action.index]).steps)
                break
            }
            case 'branch': {
                for (const option of step.options) {
                    const conditionMet = resolveExprAs(option.condition, 'boolean', exprContext).value
                    if (conditionMet) {
                        checkStop(step)
                        processSteps(option.steps)
                        break
                    }
                }
                break
            }
            case 'set': {
                const variableID = resolveExprAs(step.variable, 'variable', exprContext).value
                const value = resolveExpr(step.value, exprContext)
                exprContext.variables.setValue(variableID, value)
                break
            }
            case 'macro': {
                const macroID = resolveExprAs(step.macro, 'macro', exprContext).value
                processMacro(macroID)
                break
            }
            case 'goto': {
                const sceneID = resolveExprAs(step.scene, 'scene', exprContext).value
                throw new GoToSceneGamePlayerSignal(sceneID)
            }
            case 'returnTo': {
                throw new ReturnToStepGamePlayerSignal(step.stepID)
            }
            default: break
        }
        checkStop(step)
    }

    const processSteps = (steps: AnyStep[]) => {
        try {
            for (const step of steps) {
                processStep(step)
            }
        } catch (err) {
            if (err instanceof ReturnToStepGamePlayerSignal) {
                const index = steps.findIndex(s => s.id === err.stepID)
                if (index < 0) throw err
                return processSteps(steps.slice(index))
            }
            throw err
        }
    }

    const popScene = () => {
        throwIfNull(evalState.story?.chapter).scene = null
    }

    const popChapter = () => {
        throwIfNull(evalState.story).chapter = null
    }

    const popStory = () => {
        throwIfNull(evalState.story)
        evalState.story = null
    }

    const popMacro = () => {
        evalState.macros.pop()
    }

    try {
        if (gameState.storyID) {
            processStory(gameState.storyID)
        }
    } catch (err) {
        if (err instanceof StopGamePlayerSignal) {
            evalState.stoppedAt = err.step
        } else {
            throw err
        }
    }

    return hintTuple(evalState, sceneState)
}

