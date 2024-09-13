import { platform } from '../platform/platform'
import { gamePlayerStore } from '../store/player'
import { viewStateStore } from '../store/viewstate'
import { type AnyExpr, type AnyExprValue, castExprValue, type ExprContext, prettyPrintExprValue, resolveExpr, resolveExprAs, tryResolveExpr } from '../types/expressions'
import type { GamePlayerActionOfType, GamePlayerActionType, GamePlayerEvalState, GameSaveState, MacroPlayerEvalState, ScenePlayerSettingsState, ScenePlayerState } from '../types/player'
import { GamePlayerSignal, getInitialGameSaveState, getInitialScenePlayerState, GoToSceneGamePlayerSignal, ReturnToStepGamePlayerSignal, StepErrorGamePlayerSignal, StopGamePlayerSignal } from '../types/player'
import { type AnyVariableDefinition, type AnyVariableScope, type ChapterID, type CharacterID, getVariableValueType, type MacroID, type SceneID, type StoryID, type VariableID } from '../types/project'
import { type AnyStep, prettyPrintStep, type StepID } from '../types/steps'
import { arrayHead, arrayTail, forEachMultiple } from '../utils/array'
import { throwIfNull } from '../utils/guard'
import { immAppend, immPrepend, immRemoveWhere, immReplaceWhere, immSet } from '../utils/imm'
import { randFloat, randInt } from '../utils/rand'
import { assertExhaustive, hintTuple } from '../utils/types'
import { getEntityByID, getEntityEditorDisplayName, getProjectExprContext } from './project'

export function userPlayStory(storyID: StoryID) {
    gamePlayerStore.setValue(s => immSet(s, 'currentSave', getInitialGameSaveState(storyID)))
    viewStateStore.setValue(s => immSet(s, 'currentTab', 'play'))
}

export async function loadInitialGame() {
    const game = await platform.loadGame()
    gamePlayerStore.setValue(() => game)
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

    const processMacro = (macroID: MacroID, inputs: AnyExpr[], outputs: AnyExpr[]) => {
        const macro = throwIfNull(getEntityByID('macro', macroID))
        const macroState: MacroPlayerEvalState = {
            id: macro.id,
            variables: {},
        }
        evalState.macros.push(macroState)
        try {
            forEachMultiple(hintTuple(macro.inputs, inputs), (i, d, e) => {
                const inputVar = exprContext.resolvers.variable(d)
                if (i > inputs.length || e.type === 'unset') {
                    throw new Error(`No value was provided for the input variable ${JSON.stringify(inputVar?.name ?? d)} of macro ${JSON.stringify(macro.name)} but no value was provided`)
                }
                const value = tryResolveExpr(e, exprContext)
                if (!value) {
                    throw new Error(`Tried to set a value for the input variable ${JSON.stringify(inputVar?.name ?? d)} of macro ${JSON.stringify(macro.name)} but the value provided was invalid`)
                }
                exprContext.variables.setValue(d, value)
            })
            processSteps(macro.steps)
            popMacro()
            forEachMultiple(hintTuple(macro.outputs, outputs), (i, d, e) => {
                const outputVar = exprContext.resolvers.variable(d)
                if (i >= outputs.length || e.type === 'unset') {
                    // Skip missing or unset outputs
                    return
                }
                const variableID = resolveExprAs(e, 'variable', exprContext).value
                let value = macroState.variables[d] ?? null
                if (!value && outputVar) {
                    value = tryResolveExpr(outputVar.default, exprContext)
                }
                if (!value) {
                    throw new Error(`Tried to read the output variable ${JSON.stringify(outputVar?.name ?? d)} from macro ${JSON.stringify(macro.name)} but it did not have a value set`)
                }
                exprContext.variables.setValue(variableID, value)
            })
        } catch (err) {
            if (err instanceof GoToSceneGamePlayerSignal) {
                popMacro()
            }
            throw err
        }
    }

    const processStep = (step: AnyStep) => {
        stepHistory.push(step)
        try {
            let randomized = false
            if (step.type === 'prompt') {
                while (tryPopAction('randomize', step.id)) {
                    resolveExpr(step.randomValue, exprContext)
                    randomized = true
                }
            }
            sceneState = applyStepToScenePlayerState(sceneState, step, exprContext, { randomized })
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
                case 'setCharacter': {
                    const characterID = resolveExprAs(step.character, 'character', exprContext).value
                    const variableID = resolveExprAs(step.variable, 'variable', exprContext).value
                    const value = resolveExpr(step.value, exprContext)
                    exprContext.variables.setCharacterValue(variableID, characterID, value)
                    break
                }
                case 'macro': {
                    const macroID = resolveExprAs(step.macro, 'macro', exprContext).value
                    processMacro(macroID, step.inputs, step.outputs)
                    break
                }
                case 'goto': {
                    const sceneID = resolveExprAs(step.scene, 'scene', exprContext).value
                    throw new GoToSceneGamePlayerSignal(sceneID)
                }
                case 'returnTo': {
                    throw new ReturnToStepGamePlayerSignal(step.stepID)
                }
                case 'error': {
                    const msg = resolveExprAs(step.message, 'string', exprContext).value
                    throw new StepErrorGamePlayerSignal(step, exprContext, msg)
                }
                default: break
            }
            sceneState = cleanupScenePlayerStateAfterStep(sceneState, step, exprContext)
            checkStop(step)
        } catch (err) {
            if (err instanceof GamePlayerSignal) {
                throw err
            } else {
                throw new StepErrorGamePlayerSignal(step, exprContext, err)
            }
        }
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

    return hintTuple(evalState, sceneState, exprContext)
}

export function cleanupScenePlayerStateAfterStep(state: ScenePlayerState, step: AnyStep, ctx: ExprContext): ScenePlayerState {
    switch (step.type) {
        case 'text':
        case 'decision':
        case 'prompt':
            state = immSet(state, 'sounds', [])
            break
        default: break
    }
    return state
}

export function applyStepToScenePlayerState(state: ScenePlayerState, step: AnyStep, ctx: ExprContext, flags?: { randomized?: boolean }): ScenePlayerState {
    state = immSet(state, 'options', [])
    if (step.type !== 'prompt') state = immSet(state, 'prompt', null)
    switch (step.type) {
        case 'backdrop': {
            const backdropID = resolveExprAs(step.backdrop, 'backdrop', ctx).value
            switch (step.mode) {
                case 'replace': return immSet(state, 'backdrops', [{ backdropID, dir: 0 }])
                case 'append': return immSet(state, 'backdrops', immAppend(state.backdrops, { backdropID, dir: 1 as const }))
                case 'prepend': return immSet(state, 'backdrops', immPrepend(state.backdrops, { backdropID, dir: -1 as const }))
                case 'remove': return immSet(state, 'backdrops', immRemoveWhere(state.backdrops, b => b.backdropID === backdropID))
                default: assertExhaustive(step, `Unhandled backdrop mode ${prettyPrintStep(step, ctx)}`)
            }
            break
        }
        case 'music': return immSet(state, 'song', immSet(state.song, 'songID', resolveExprAs(step.song, 'song', ctx).value))
        case 'enter': return immSet(state, 'characters', immAppend(state.characters, {
            characterID: resolveExprAs(step.character, 'character', ctx).value,
            portraitID: resolveExprAs(step.portrait, 'portrait', ctx).value,
            location: resolveExprAs(step.location, 'location', ctx).value,
        }))
        case 'portrait': {
            const characterID = resolveExprAs(step.character, 'character', ctx).value
            return immSet(state, 'characters', immReplaceWhere(state.characters, s => s.characterID === characterID, c => immSet(c, 'portraitID', resolveExprAs(step.portrait, 'portrait', ctx).value)))
        }
        case 'move': {
            const characterID = resolveExprAs(step.character, 'character', ctx).value
            const location = resolveExprAs(step.location, 'location', ctx).value
            return immSet(state, 'characters', immReplaceWhere(state.characters, s => s.characterID === characterID, c => immSet(c, 'location', {
                position: location.position === 'auto' ? c.location.position : location.position,
                height: location.height === 'auto' ? c.location.height : location.height,
                scale: location.scale === 'auto' ? c.location.scale : location.scale,
            })))
        }
        case 'exit': {
            const characterID = resolveExprAs(step.character, 'character', ctx).value
            return immSet(state, 'characters', state.characters.filter(c => c.characterID !== characterID))
        }
        case 'sound': return immSet(state, 'sounds', immAppend(state.sounds, { soundID: resolveExprAs(step.sound, 'sound', ctx).value }))
        case 'text': {
            const speakerID = resolveExprAs(step.speaker, 'character', ctx).value
            const speaker = throwIfNull(ctx.resolvers.character(speakerID))
            const speakerAlias = speaker.alias.type !== 'unset' ? resolveExprAs(speaker.alias, 'string', ctx).value : null
            return immSet(state, 'dialogue', {
                speakerID,
                speakerAlias,
                text: resolveExprAs(step.text, 'string', ctx).value,
                mode: 'adv',
            })
        }
        case 'narrate': return immSet(state, 'dialogue', {
            speakerID: null,
            speakerAlias: null,
            text: resolveExprAs(step.text, 'string', ctx).value,
            mode: step.mode,
        })
        case 'decision': return immSet(state, 'options', step.options.map((o, index) => ({ index, enabled: resolveExprAs(o.condition, 'boolean', ctx).value, text: resolveExprAs(o.text, 'string', ctx).value })))
        case 'prompt': {
            const label = step.label
            const variableID = resolveExprAs(step.variable, 'variable', ctx).value
            const variable = throwIfNull(ctx.resolvers.variable(variableID))
            const type = getVariableValueType(variable, ctx)

            let randomExprValue: AnyExprValue | null = null
            if (step.randomValue.type !== 'unset') {
                randomExprValue = resolveExpr(step.randomValue, ctx)
            }
            const randomizable = randomExprValue !== null
            let initialExprValue: AnyExprValue | null = randomExprValue
            if (!flags?.randomized && step.initialValue.type !== 'unset') {
                initialExprValue = resolveExpr(step.initialValue, ctx)
            }
            if (type === 'string') {
                const initialValue = castExprValue(throwIfNull(initialExprValue), 'string', ctx).value
                return immSet(state, 'prompt', { label, type, initialValue, randomizable })
            } else {
                throw new Error(`Prompts for variable types other than string are not supported: ${type}`)
            }
        }
        default: return state
    }
}

function isVariableInScope(evalState: GamePlayerEvalState, variable: AnyVariableDefinition, characterID: CharacterID | null): boolean {
    const macroID = arrayTail(evalState.macros)?.id
    switch (variable.scope.type) {
        case 'allStories': return !!evalState.story
        case 'stories': return !!evalState.story && variable.scope.value.includes(evalState.story.id)
        case 'story': return !!evalState.story && variable.scope.value === evalState.story.id
        case 'allChapters': return !!evalState.story?.chapter
        case 'chapters': return !!evalState.story?.chapter && variable.scope.value.includes(evalState.story.chapter.id)
        case 'chapter': return !!evalState.story?.chapter && variable.scope.value === evalState.story.chapter.id
        case 'allScenes': return !!evalState.story?.chapter?.scene
        case 'scenes': return !!evalState.story?.chapter?.scene && variable.scope.value.includes(evalState.story.chapter.scene.id)
        case 'scene': return !!evalState.story?.chapter?.scene && variable.scope.value === evalState.story.chapter.scene.id
        case 'allCharacters': return !!characterID
        case 'characters': return !!characterID && variable.scope.value.includes(characterID)
        case 'character': return !!characterID && variable.scope.value === characterID
        case 'allMacros': return !!macroID
        case 'macros': return !!macroID && variable.scope.value.includes(macroID)
        case 'macro': return !!macroID && variable.scope.value === macroID
    }
}

function getVariableTarget(evalState: GamePlayerEvalState, scope: AnyVariableScope, characterID: CharacterID | null) {
    switch (scope.type) {
        case 'allStories':
        case 'stories':
        case 'story':
            return throwIfNull(evalState.story?.variables)
        case 'allChapters':
        case 'chapters':
        case 'chapter':
            return throwIfNull(evalState.story?.chapter?.variables)
        case 'allScenes':
        case 'scenes':
        case 'scene':
            return throwIfNull(evalState.story?.chapter?.scene?.variables)
        case 'allCharacters':
        case 'characters':
        case 'character': {
            const story = throwIfNull(evalState.story)
            const charID = throwIfNull(characterID)
            const character = story.characters[charID] ?? { variables: {} }
            story.characters[charID] = character
            return character.variables
        }
        case 'allMacros':
        case 'macros':
        case 'macro': {
            const macro = throwIfNull(arrayTail(evalState.macros))
            return macro.variables
        }
        default: assertExhaustive(scope, `Unimplemented variable scope type ${JSON.stringify(scope)}`)
    }
}

function getVariable(evalState: GamePlayerEvalState, variableID: VariableID, characterID: CharacterID | null, exprContext: ExprContext) {
    const variable = throwIfNull(exprContext.resolvers.variable(variableID))
    if (!isVariableInScope(evalState, variable, characterID)) throw new Error(`Tried to get a value for ${getEntityEditorDisplayName('variable', variable)} but it was not in scope`)
    const variableTarget = getVariableTarget(evalState, variable.scope, characterID)
    return variableTarget[variableID] ?? resolveExpr(variable.default, exprContext)
}

function setVariable(evalState: GamePlayerEvalState, variableID: VariableID, value: AnyExprValue, characterID: CharacterID | null, exprContext: ExprContext) {
    const variable = throwIfNull(exprContext.resolvers.variable(variableID))
    if (!isVariableInScope(evalState, variable, characterID)) throw new Error(`Tried to set a value for ${getEntityEditorDisplayName('variable', variable)} but it was not in scope`)
    try {
        const variableType = getVariableValueType(variable, exprContext)
        const convertedValue = castExprValue(value, variableType, exprContext)
        const variableTarget = getVariableTarget(evalState, variable.scope, characterID)
        variableTarget[variableID] = convertedValue
    } catch (err) {
        throw new Error(`An error occurred while trying to set ${variable.name} to value ${prettyPrintExprValue(value, exprContext)}:\n${String(err)}`, { cause: err })
    }
}

export function getExprContext(getState: () => GamePlayerEvalState, setState: (setter: (state: GamePlayerEvalState) => GamePlayerEvalState) => void): ExprContext {
    const projectCtx = getProjectExprContext()

    const ctx: ExprContext = {
        ...projectCtx,
        variables: {
            getValue: (id) => getVariable(getState(), id, null, ctx),
            setValue: (id, value) => setVariable(getState(), id, value, null, ctx),
            getCharacterValue: (id, characterID) => getVariable(getState(), id, characterID, ctx),
            setCharacterValue: (id, characterID, value) => setVariable(getState(), id, value, characterID, ctx),
        },
        random: {
            float(min, max) {
                const result = randFloat(getState().randState, min, max)
                setState(s => immSet(s, 'randState', result[0]))
                return result[1]
            },
            int(min, max) {
                const result = randInt(getState().randState, min, max)
                setState(s => immSet(s, 'randState', result[0]))
                return result[1]
            },
        },
    }
    return ctx
}

