import { Fragment, useCallback, useMemo } from 'react'
import type { AnyStep, StepID, StepType } from '../../types/steps'
import { createStep, isStepType, parseAnyStep, STEP_TYPES } from '../../types/steps'
import { immAppend, immInsertAt, immRemoveAt, immReplaceAt, immReplaceBy, immSet, immSetProps } from '../../utils/imm'
import { EditorIcon } from '../common/EditorIcon'
import { COMMON_ICONS, STEP_ICONS } from '../common/Icons'
import { ExpressionEditor, ExpressionField } from './ExpressionEditor'
import { StringField } from '../common/StringField'
import { classes, prettyPrintIdentifier } from '../../utils/display'
import { createDefaultExpr, type ExprContext } from '../../types/expressions'
import { getProjectExprContext, immGenerateID } from '../../store/operations'
import { projectStore } from '../../store/project'
import { Field } from '../common/Field'
import { SceneRenderer } from '../player/SceneRenderer'
import { applyStepToRenderSceneState, getInitialRenderSceneState, type ScenePlayerState } from '../../types/player'
import styles from './StepSequenceEditor.module.css'
import { DropdownMenuItem, SearchDropdownMenu, useDropdownMenuState } from '../common/DropdownMenu'
import { useSelector } from '../../utils/store'
import { settingsStore } from '../../store/settings'
import { useDrag, useDrop } from '../../utils/hooks'
import { throwIfNull, tryParseValue } from '../../utils/guard'
import { assertExhaustive } from '../../utils/types'
import { platform } from '../../platform/platform'
import { viewStateStore } from '../../store/viewstate'
import { arrayHead } from '../../utils/array'

const StepEditor = ({ step, setStep, deleteStep, ctx }: { step: AnyStep, setStep: (setter: (step: AnyStep) => AnyStep) => void, deleteStep: () => void, ctx: ExprContext }) => {
    const getDeveloperMode = useSelector(settingsStore, s => s.developerMode)

    const onDeleteStep = (e: React.MouseEvent) => {
        e.stopPropagation()
        deleteStep()
    }

    const subEditor = (() => {
        switch (step.type) {
            case 'text': return <>
                <ExpressionField label='Speaker' value={step.speaker} setValue={expr => setStep(s => isStepType(s, 'text') ? immSet(s, 'speaker', expr) : s)} paramTypes={['character']} ctx={ctx} />
                <ExpressionField label='Text' value={step.text} setValue={expr => setStep(s => isStepType(s, 'text') ? immSet(s, 'text', expr) : s)} paramTypes={['string']} ctx={ctx} />
            </>
            case 'backdrop': return <>
                <ExpressionField label='Backdrop' value={step.backdrop} setValue={expr => setStep(s => isStepType(s, 'backdrop') ? immSet(s, 'backdrop', expr) : s)} paramTypes={['backdrop']} ctx={ctx} />
            </>
            case 'enter': return <>
                <ExpressionField label='Character' value={step.character} setValue={expr => setStep(s => isStepType(s, 'enter') ? immSet(s, 'character', expr) : s)} paramTypes={['character']} ctx={ctx} />
                <ExpressionField label='Portrait' value={step.portrait} setValue={expr => setStep(s => isStepType(s, 'enter') ? immSet(s, 'portrait', expr) : s)} paramTypes={['portrait']} ctx={ctx} />
                <ExpressionField label='Location' value={step.location} setValue={expr => setStep(s => isStepType(s, 'enter') ? immSet(s, 'location', expr) : s)} paramTypes={['location']} ctx={ctx} />
            </>
            case 'exit': return <>
                <ExpressionField label='Character' value={step.character} setValue={expr => setStep(s => isStepType(s, 'enter') ? immSet(s, 'character', expr) : s)} paramTypes={['character']} ctx={ctx} />
                <ExpressionField label='Location' value={step.location} setValue={expr => setStep(s => isStepType(s, 'enter') ? immSet(s, 'location', expr) : s)} paramTypes={['location']} ctx={ctx} />
            </>
            case 'move': return <>
                <ExpressionField label='Character' value={step.character} setValue={expr => setStep(s => isStepType(s, 'move') ? immSet(s, 'character', expr) : s)} paramTypes={['character']} ctx={ctx} />
                <ExpressionField label='Location' value={step.location} setValue={expr => setStep(s => isStepType(s, 'move') ? immSet(s, 'location', expr) : s)} paramTypes={['location']} ctx={ctx} />
            </>
            case 'portrait': return <>
                <ExpressionField label='Character' value={step.character} setValue={expr => setStep(s => isStepType(s, 'portrait') ? immSet(s, 'character', expr) : s)} paramTypes={['character']} ctx={ctx} />
                <ExpressionField label='Portrait' value={step.portrait} setValue={expr => setStep(s => isStepType(s, 'portrait') ? immSet(s, 'portrait', expr) : s)} paramTypes={['portrait']} ctx={ctx} />
            </>
            case 'music': return <>
                <ExpressionField label='Song' value={step.song} setValue={expr => setStep(s => isStepType(s, 'music') ? immSet(s, 'song', expr) : s)} paramTypes={['song']} ctx={ctx} />
            </>
            case 'sound': return <>
                <ExpressionField label='Sound' value={step.sound} setValue={expr => setStep(s => isStepType(s, 'sound') ? immSet(s, 'sound', expr) : s)} paramTypes={['sound']} ctx={ctx} />
            </>
            case 'decision': return <>
                {step.options.map((o, i) => <div key={i} className={styles.optionEditor}>
                    <ExpressionField label='Text' value={o.text} setValue={expr => setStep(s => isStepType(s, 'decision') ? immSet(s, 'options', immReplaceAt(s.options, i, immSet(throwIfNull(s.options[i]), 'text', expr))) : s)} paramTypes={['string']} ctx={ctx} />
                    <ExpressionField label='Condition' value={o.condition} setValue={expr => setStep(s => isStepType(s, 'decision') ? immSet(s, 'options', immReplaceAt(s.options, i, immSet(throwIfNull(s.options[i]), 'condition', expr))) : s)} paramTypes={['boolean']} ctx={ctx} />
                    <Field label='Delete Option'>
                        <EditorIcon path={COMMON_ICONS.deleteItem} label='Delete Option' onClick={() => setStep(s => isStepType(s, 'decision') ? immSet(s, 'options', immRemoveAt(s.options, i)) : s)} />
                    </Field>
                </div>)}
                <Field label='Add Option'>
                    <EditorIcon path={COMMON_ICONS.addItem} label='Add Option' onClick={() => setStep(s => isStepType(s, 'decision') ? immSet(s, 'options', immAppend(s.options, { text: createDefaultExpr('string', ctx), condition: createDefaultExpr('boolean', ctx), steps: [] })) : s)} />
                </Field>
            </>
            case 'branch': return <>
                {step.options.map((o, i) => <div key={i} className={styles.optionEditor}>
                    <ExpressionField label='Condition' value={o.condition} setValue={expr => setStep(s => isStepType(s, 'branch') ? immSet(s, 'options', immReplaceAt(s.options, i, immSet(throwIfNull(s.options[i]), 'condition', expr))) : s)} paramTypes={['boolean']} ctx={ctx} />
                    <Field label='Delete Option'>
                        <EditorIcon path={COMMON_ICONS.deleteItem} label='Delete Option' onClick={() => setStep(s => isStepType(s, 'branch') ? immSet(s, 'options', immRemoveAt(s.options, i)) : s)} />
                    </Field>
                </div>)}
                <Field label='Add Option'>
                    <EditorIcon path={COMMON_ICONS.addItem} label='Add Option' onClick={() => setStep(s => isStepType(s, 'branch') ? immSet(s, 'options', immAppend(s.options, { condition: createDefaultExpr('boolean', ctx), steps: [] })) : s)} />
                </Field>
            </>
            case 'set': return <>
                <ExpressionField label='Variable' value={step.variable} setValue={expr => setStep(s => isStepType(s, 'set') ? immSet(s, 'variable', expr) : s)} paramTypes={['variable']} ctx={ctx} />
                <ExpressionField label='Value' value={step.value} setValue={expr => setStep(s => isStepType(s, 'set') ? immSet(s, 'value', expr) : s)} paramTypes={null} ctx={ctx} />
            </>
            case 'macro': return <>
                <ExpressionField label='Macro' value={step.macro} setValue={expr => setStep(s => isStepType(s, 'macro') ? immSet(s, 'macro', expr) : s)} paramTypes={['macro']} ctx={ctx} />
                {step.inputs.map((input, i) => <ExpressionField key={i} label={`Input ${String(i)}`} value={input} setValue={expr => setStep(s => isStepType(s, 'macro') ? immSet(s, 'inputs', immReplaceAt(s.inputs, i, expr)) : s)} paramTypes={null} ctx={ctx} />)}
                {step.outputs.map((output, i) => <ExpressionField key={i} label={`Output ${String(i)}`} value={output} setValue={expr => setStep(s => isStepType(s, 'macro') ? immSet(s, 'outputs', immReplaceAt(s.outputs, i, expr)) : s)} paramTypes={['variable']} ctx={ctx} />)}
            </>
            default: assertExhaustive(step, `Unhandled step type ${JSON.stringify(step)}`)
        }
    })

    return <div className={styles.stepEditor}>
        {getDeveloperMode() ? <>
            <StringField label='Step ID' value={step.id} />
            <StringField label='Step Type' value={prettyPrintIdentifier(step.type)} />
        </> : null}
        {subEditor()}
        <Field label='Delete Step'>
            <EditorIcon path={COMMON_ICONS.deleteItem} label='Delete Step' onClick={onDeleteStep} />
        </Field>
    </div>
}

const StepList = ({ steps, setSteps, selected, setSelected, ctx, rootSteps, setRootSteps }: { steps: AnyStep[], setSteps: (setter: (steps: AnyStep[]) => AnyStep[]) => void, selected: StepID, setSelected: (id: StepID) => void, ctx: ExprContext, rootSteps: AnyStep[], setRootSteps: (setter: (steps: AnyStep[]) => AnyStep[]) => void }) => {
    const [dropdownProps, openDropdown] = useDropdownMenuState()

    const onAddStep = (e: React.MouseEvent, type: StepType) => {
        e.stopPropagation()
        const [project, id] = immGenerateID<StepID>(projectStore.getSnapshot())
        projectStore.setValue(() => project)
        setSteps(steps => immAppend(steps, createStep(id, type, ctx)))
        setSelected(id)
    }

    const StepGap = ({ before, after }: { before: StepID | null, after: StepID | null }) => {
        const [dropProps, dragOver] = useDrop('move', useCallback(values => {
            if (values.type === 'json') {
                const parsed = tryParseValue(values.value, 'step', parseAnyStep)
                if (parsed.success) {
                    const [step, , deleteStep] = getDeepStep(parsed.value.id, rootSteps, setRootSteps, [])
                    if (step) {
                        deleteStep()
                        setSteps(s => {
                            let index = s.findIndex(step => step.id === after)
                            if (index <= 0) index = s.findIndex(step => step.id === before) + 1
                            return immInsertAt(s, index, step)
                        })
                    }
                }
            }
        }, [before, after]))
        return <div {...dropProps} className={classes(styles.stepGap, { [styles.dragOver ?? '']: dragOver })}>
            <div className={styles.stepLine} />
        </div>
    }

    return <div className={styles.timeline}>
        <StepGap before={null} after={arrayHead(steps)?.id ?? null} />
        {steps.map((s, i) => <Fragment key={s.id}>
            <StepBubble key={s.id} step={s} setStep={setter => setSteps(steps => immReplaceAt(steps, i, setter(throwIfNull(steps[i]))))} deleteStep={() => setSteps(steps => immRemoveAt(steps, i))} selected={selected} setSelected={setSelected} ctx={ctx} rootSteps={rootSteps} setRootSteps={setRootSteps} />
            <StepGap before={s.id} after={steps[i + 1]?.id ?? null} />
        </Fragment>)}
        <div className={styles.outlineBubble} onClick={openDropdown}>
            <EditorIcon path={COMMON_ICONS.addItem} />
        </div>
        <SearchDropdownMenu items={STEP_TYPES} filter={(t, search) => t.toLowerCase().includes(search.toLowerCase())} {...dropdownProps}>
            {(type) => <DropdownMenuItem key={type} onClick={e => (onAddStep(e, type), dropdownProps.onClose())}>
                <EditorIcon path={STEP_ICONS[type]} label={prettyPrintIdentifier(type)} />
                <span>{prettyPrintIdentifier(type)}</span>
            </DropdownMenuItem>}
        </SearchDropdownMenu>
    </div>
}

const StepBubble = ({ step, setStep, selected, setSelected, ctx, rootSteps, setRootSteps }: { step: AnyStep, setStep: (setter: (step: AnyStep) => AnyStep) => void, deleteStep: () => void, selected: StepID, setSelected: (id: StepID) => void, ctx: ExprContext, rootSteps: AnyStep[], setRootSteps: (setter: (steps: AnyStep[]) => AnyStep[]) => void }) => {
    const [dragProps, dragging] = useDrag(step)

    const onSelect = (e: React.MouseEvent) => {
        e.stopPropagation()
        setSelected(step.id)
    }

    switch (step.type) {
        case 'decision':
        case 'branch':
            return <div {...dragProps} className={classes(styles.bubble, { [styles.active ?? '']: selected === step.id, [styles.dragging ?? '']: dragging })}>
                <div className={styles.bubbleFront} onClick={onSelect}>
                    <EditorIcon path={STEP_ICONS[step.type]} />
                </div>
                <div className={styles.bubbleBody}>
                    {step.type === 'decision' ? <>
                        {step.options.map((o, i) => <div key={i} className={styles.bubbleBodyRow}>
                            <div className={styles.option}>
                                <ExpressionEditor expr={o.text} setExpr={expr => setStep(s => isStepType(s, 'decision') ? immSet(s, 'options', immReplaceAt(s.options, i, immSet(throwIfNull(s.options[i]), 'text', expr))) : s)} paramTypes={['string']} ctx={ctx} />
                            </div>
                            <StepList steps={o.steps} setSteps={setter => setStep(s => isStepType(s, 'decision') ? immSet(s, 'options', immReplaceAt(s.options, i, immSet(throwIfNull(s.options[i]), 'steps', setter(throwIfNull(s.options[i]).steps)))) : s)} selected={selected} setSelected={setSelected} ctx={ctx} rootSteps={rootSteps} setRootSteps={setRootSteps} />
                        </div>)}
                    </> : null}
                    {step.type === 'branch' ? <>
                        {step.options.map((o, i) => <div key={i} className={styles.bubbleBodyRow}>
                            <div className={styles.option}>
                                <ExpressionEditor expr={o.condition} setExpr={expr => setStep(s => isStepType(s, 'branch') ? immSet(s, 'options', immReplaceAt(s.options, i, immSet(throwIfNull(s.options[i]), 'condition', expr))) : s)} ctx={ctx} />
                            </div>
                            <StepList steps={o.steps} setSteps={setter => setStep(s => isStepType(s, 'branch') ? immSet(s, 'options', immReplaceAt(s.options, i, immSet(throwIfNull(s.options[i]), 'steps', setter(throwIfNull(s.options[i]).steps)))) : s)} selected={selected} setSelected={setSelected} ctx={ctx} rootSteps={rootSteps} setRootSteps={setRootSteps} />
                        </div>)}
                    </> : null}
                </div>
                <div className={styles.bubbleBack} onClick={onSelect}>

                </div>
            </div>
        default:
            return <div {...dragProps} className={classes(styles.simpleBubble, { [styles.active ?? '']: selected === step.id, [styles.dragging ?? '']: dragging })} onClick={onSelect}>
                <EditorIcon path={STEP_ICONS[step.type]} label={prettyPrintIdentifier(step.type)} />
            </div>
    }
}

function getDeepStep(stepID: StepID, steps: AnyStep[], setSteps: (setter: (steps: AnyStep[]) => AnyStep[]) => void, previousSteps: AnyStep[]): [AnyStep, (setter: (step: AnyStep) => AnyStep) => void, () => void, AnyStep[]] | [null, null, null, null] {
    const index = steps.findIndex(s => s.id === stepID)
    if (index >= 0) {
        return [
            throwIfNull(steps[index]),
            setter => setSteps(steps => immReplaceAt(steps, index, setter(throwIfNull(steps[index])))),
            () => setSteps(steps => steps.filter(s => s.id !== stepID)),
            previousSteps.concat(steps.slice(0, index)),
        ]
    }
    for (const s of steps) {
        if (s.type === 'decision' || s.type === 'branch') {
            for (let i = 0; i < s.options.length; i++) {
                const [step, setStep, deleteStep, childPreviousSteps] = getDeepStep(stepID, throwIfNull(s.options[i]).steps, setter => setSteps(steps => immReplaceBy(steps, s => s.id, immSet(s, 'options', immReplaceAt(s.options, i, immSet(throwIfNull(s.options[i]), 'steps', setter(throwIfNull(s.options[i]).steps)))))), previousSteps.concat(steps.slice(0, steps.findIndex(o => o.id === s.id))))
                if (step) return [step, setStep, deleteStep, childPreviousSteps]
            }
        }
    }
    return [null, null, null, null]
}

export const StepSequenceEditor = ({ steps, setSteps }: { steps: AnyStep[], setSteps: (setter: (steps: AnyStep[]) => AnyStep[]) => void }) => {
    const selectedStepID = useSelector(viewStateStore, s => s.scopes.step ?? '' as StepID)
    const setSelectedStepID = useCallback((value: StepID) => {
        viewStateStore.setValue(s => immSet(s, 'scopes', immSet(s.scopes, 'step', value)))
    }, [])

    const ctx = getProjectExprContext()

    const [selectedStep, setSelectedStep, deleteSelectedStep, selectedPreviousSteps] = useMemo(() => getDeepStep(selectedStepID(), steps, setSteps, []), [selectedStepID, steps, setSteps])

    const sceneState: ScenePlayerState = useMemo(() => {
        let state = getInitialRenderSceneState()
        state = immSet(state, 'settings', immSetProps(state.settings, {
            musicVolume: 0,
            soundVolume: 1,
            uiVolume: 1,
        }))
        if (!selectedStep) return state

        state = selectedPreviousSteps.reduce((p, c) => {
            try {
                return applyStepToRenderSceneState(p, c, ctx)
            } catch (err) {
                void platform.error(err)
                return p
            }
        }, state)

        try {
            state = applyStepToRenderSceneState(state, selectedStep, ctx)
            return state
        } catch (err) {
            void platform.error(err)
            return state
        }
    }, [ctx, selectedPreviousSteps, selectedStep])

    return <div className={styles.sequenceEditor}>
        <SceneRenderer state={sceneState} />
        <div className={styles.timeline}>
            <StepList steps={steps} setSteps={setSteps} selected={selectedStepID()} setSelected={setSelectedStepID} ctx={ctx} rootSteps={steps} setRootSteps={setSteps} />
        </div>
        {selectedStep ? <StepEditor key={selectedStep.id} step={selectedStep} setStep={setSelectedStep} deleteStep={deleteSelectedStep} ctx={ctx} /> : null}
    </div>
}
