import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'

import { applyStepToScenePlayerState } from '../../operations/player'
import { getEntityDisplayName, getEntityDisplayNameByID, getEntityEditorDisplayName, getEntityEditorDisplayNameByID, immGenerateID } from '../../operations/project'
import { useProjectReadonly } from '../../operations/storage'
import { platform } from '../../platform/platform'
import { projectStore } from '../../store/project'
import { settingsStore } from '../../store/settings'
import { viewStateStore } from '../../store/viewstate'
import { createDefaultExpr, type ExprContext, resolveExprAs, tryResolveExprAs } from '../../types/expressions'
import { getInitialScenePlayerState, type ScenePlayerState } from '../../types/player'
import type { MacroDefinition } from '../../types/project'
import type { AnyStep, StepID, StepType } from '../../types/steps'
import { createStep, getDeepStep, isStepType, parseAnyStep, STEP_TYPES } from '../../types/steps'
import { arrayHead, arrayTail } from '../../utils/array'
import { classes, prettyPrintIdentifier } from '../../utils/display'
import { throwIfNull, tryParseValue } from '../../utils/guard'
import { useDrag, useDrop } from '../../utils/hooks'
import { immAppend, immInsertAt, immPadTo, immRemoveAt, immReplaceAt, immSet } from '../../utils/imm'
import { useSelector } from '../../utils/store'
import { assertExhaustive } from '../../utils/types'
import { DropdownField } from '../common/DropdownField'
import { DropdownMenuItem, SearchDropdownMenu, useDropdownMenuState } from '../common/DropdownMenu'
import { EditorIcon } from '../common/EditorIcon'
import { Field, type FieldProps } from '../common/Field'
import { COMMON_ICONS, STEP_ICONS } from '../common/Icons'
import { StringField } from '../common/StringField'
import { PlayerIcon } from '../player/PlayerIcon'
import { ScenePlayer } from '../player/ScenePlayer'
import { ExpressionEditor, ExpressionField } from './ExpressionEditor'

import styles from './StepSequenceEditor.module.css'

function getStepTypeLabel(type: StepType) {
    switch (type) {
        case 'set': return 'Set Variable'
        case 'setCharacter': return 'Set Character Variable'
        default: return prettyPrintIdentifier(type)
    }
}

const StepField = ({ className, label, value, setValue, steps, setSteps, selected, setSelected }: FieldProps<StepID> & { steps: AnyStep[], setSteps: (setter: (steps: AnyStep[]) => AnyStep[]) => void, selected: StepID | null, setSelected: (id: StepID | null) => void }) => {
    const [dropProps, dragOver] = useDrop('move', useCallback(values => {
        if (values.type === 'json') {
            const parsed = tryParseValue(values.value, 'step', parseAnyStep)
            if (parsed.success) {
                const deepStep = getDeepStep(parsed.value.id, steps, setSteps, [], null)
                if (deepStep) {
                    setValue?.(deepStep.step.id)
                }
            }
        }
    }, [setSteps, setValue, steps]))

    const deepStep = getDeepStep(value, steps, setSteps, [], null)

    return <Field label={label}>
        <div className={classes(styles.stepField, className)}>
            {deepStep ? <div className={classes(styles.simpleBubble)} onClick={() => setSelected(value)}>
                <EditorIcon path={STEP_ICONS[deepStep.step.type]} label={getStepTypeLabel(deepStep.step.type)} />
            </div> : null}
            <div {...dropProps} className={classes(styles.stepGap, { [styles.dragOver ?? '']: dragOver })}>
                <div className={styles.stepLine} />
            </div>
            <span>Drag step here</span>
        </div>
    </Field>
}

const StepEditor = ({ step, setStep, deleteStep, steps, setSteps, selected, setSelected, ctx }: { step: AnyStep, setStep: (setter: (step: AnyStep) => AnyStep) => void, deleteStep: () => void, steps: AnyStep[], setSteps: (setter: (steps: AnyStep[]) => AnyStep[]) => void, selected: StepID | null, setSelected: (id: StepID | null) => void, ctx: ExprContext }) => {
    const getDeveloperMode = useSelector(settingsStore, s => s.developerMode)
    const readonly = useProjectReadonly()

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
            case 'narrate': return <>
                <DropdownField<typeof step.mode> label='Mode' value={step.mode} setValue={mode => setStep(s => isStepType(s, 'narrate') ? immSet(s, 'mode', mode) : s)} options={['adv', 'nvl', 'pop']} format={m => m.toUpperCase()} />
                <ExpressionField label='Text' value={step.text} setValue={expr => setStep(s => isStepType(s, 'narrate') ? immSet(s, 'text', expr) : s)} paramTypes={['string']} ctx={ctx} />
            </>
            case 'backdrop': return <>
                <ExpressionField label='Backdrop' value={step.backdrop} setValue={expr => setStep(s => isStepType(s, 'backdrop') ? immSet(s, 'backdrop', expr) : s)} paramTypes={['backdrop']} ctx={ctx} />
                <DropdownField<typeof step.mode> label='Mode' value={step.mode} setValue={mode => setStep(s => isStepType(s, 'backdrop') ? immSet(s, 'mode', mode) : s)} options={['replace', 'append', 'prepend', 'remove']} format={m => prettyPrintIdentifier(m)} />
            </>
            case 'enter': return <>
                <ExpressionField label='Character' value={step.character} setValue={expr => setStep(s => isStepType(s, 'enter') ? immSet(s, 'character', expr) : s)} paramTypes={['character']} ctx={ctx} />
                <ExpressionField label='Portrait' value={step.portrait} setValue={expr => setStep(s => isStepType(s, 'enter') ? immSet(s, 'portrait', expr) : s)} paramTypes={['portrait']} ctx={ctx} />
                <ExpressionField label='Location' value={step.location} setValue={expr => setStep(s => isStepType(s, 'enter') ? immSet(s, 'location', expr) : s)} paramTypes={['location']} ctx={ctx} />
            </>
            case 'exit': return <>
                <ExpressionField label='Character' value={step.character} setValue={expr => setStep(s => isStepType(s, 'exit') ? immSet(s, 'character', expr) : s)} paramTypes={['character']} ctx={ctx} />
                <ExpressionField label='Location' value={step.location} setValue={expr => setStep(s => isStepType(s, 'exit') ? immSet(s, 'location', expr) : s)} paramTypes={['location']} ctx={ctx} />
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
                    {!readonly ? <Field label='Delete Option'>
                        <EditorIcon path={COMMON_ICONS.deleteItem} label='Delete Option' onClick={() => setStep(s => isStepType(s, 'decision') ? immSet(s, 'options', immRemoveAt(s.options, i)) : s)} />
                    </Field> : null}
                </div>)}
                {!readonly ? <Field label='Add Option'>
                    <EditorIcon path={COMMON_ICONS.addItem} label='Add Option' onClick={() => setStep(s => isStepType(s, 'decision') ? immSet(s, 'options', immAppend(s.options, { text: createDefaultExpr('string', ctx), condition: createDefaultExpr('boolean', ctx), steps: [] })) : s)} />
                </Field> : null}
            </>
            case 'branch': return <>
                {step.options.map((o, i) => <div key={i} className={styles.optionEditor}>
                    <ExpressionField label='Condition' value={o.condition} setValue={expr => setStep(s => isStepType(s, 'branch') ? immSet(s, 'options', immReplaceAt(s.options, i, immSet(throwIfNull(s.options[i]), 'condition', expr))) : s)} paramTypes={['boolean']} ctx={ctx} />
                    {!readonly ? <Field label='Delete Option'>
                        <EditorIcon path={COMMON_ICONS.deleteItem} label='Delete Option' onClick={() => setStep(s => isStepType(s, 'branch') ? immSet(s, 'options', immRemoveAt(s.options, i)) : s)} />
                    </Field> : null}
                </div>)}
                {!readonly ? <Field label='Add Option'>
                    <EditorIcon path={COMMON_ICONS.addItem} label='Add Option' onClick={() => setStep(s => isStepType(s, 'branch') ? immSet(s, 'options', immAppend(s.options, { condition: createDefaultExpr('boolean', ctx), steps: [] })) : s)} />
                </Field> : null}
            </>
            case 'prompt': return <>
                <StringField label='Label' value={step.label} setValue={label => setStep(s => isStepType(s, 'prompt') ? immSet(s, 'label', label) : s)} />
                <ExpressionField label='Variable' value={step.variable} setValue={expr => setStep(s => isStepType(s, 'prompt') ? immSet(s, 'variable', expr) : s)} paramTypes={['variable']} ctx={ctx} />
                <ExpressionField label='Initial Value' value={step.initialValue} setValue={expr => setStep(s => isStepType(s, 'prompt') ? immSet(s, 'initialValue', expr) : s)} paramTypes={null} ctx={ctx} />
                <ExpressionField label='Random Value' value={step.randomValue} setValue={expr => setStep(s => isStepType(s, 'prompt') ? immSet(s, 'randomValue', expr) : s)} paramTypes={null} ctx={ctx} />
            </>
            case 'set': return <>
                <ExpressionField label='Variable' value={step.variable} setValue={expr => setStep(s => isStepType(s, 'set') ? immSet(s, 'variable', expr) : s)} paramTypes={['variable']} ctx={ctx} />
                <ExpressionField label='Value' value={step.value} setValue={expr => setStep(s => isStepType(s, 'set') ? immSet(s, 'value', expr) : s)} paramTypes={null} ctx={ctx} />
            </>
            case 'setCharacter': return <>
                <ExpressionField label='Character' value={step.character} setValue={expr => setStep(s => isStepType(s, 'setCharacter') ? immSet(s, 'character', expr) : s)} paramTypes={['character']} ctx={ctx} />
                <ExpressionField label='Variable' value={step.variable} setValue={expr => setStep(s => isStepType(s, 'setCharacter') ? immSet(s, 'variable', expr) : s)} paramTypes={['variable']} ctx={immSet(ctx, 'scope', { ...ctx.scope, character: tryResolveExprAs(step.character, 'character', ctx)?.value ?? true })} />
                <ExpressionField label='Value' value={step.value} setValue={expr => setStep(s => isStepType(s, 'setCharacter') ? immSet(s, 'value', expr) : s)} paramTypes={null} ctx={ctx} />
            </>
            case 'macro': {
                let macro: MacroDefinition | null = null
                try {
                    const macroID = resolveExprAs(step.macro, 'macro', ctx).value
                    macro = ctx.resolvers.macro(macroID)
                } catch {
                    // Ignore unresolved macro
                }
                return <>
                    <ExpressionField label='Macro' value={step.macro} setValue={expr => setStep(s => isStepType(s, 'macro') ? immSet(s, 'macro', expr) : s)} paramTypes={['macro']} ctx={ctx} />
                    {macro ? <>
                        {macro.inputs.map((input, i) => <ExpressionField key={i} label={getEntityDisplayNameByID('variable', input, false)} value={step.inputs[i] ?? createDefaultExpr('unset', ctx)} setValue={expr => setStep(s => isStepType(s, 'macro') ? immSet(s, 'inputs', immReplaceAt(immPadTo(s.inputs, i + 1, () => createDefaultExpr('unset', ctx)), i, expr)) : s)} paramTypes={null} ctx={ctx} />)}
                        {macro.outputs.map((output, i) => <ExpressionField key={i} label={getEntityDisplayNameByID('variable', output, false)} value={step.outputs[i] ?? createDefaultExpr('unset', ctx)} setValue={expr => setStep(s => isStepType(s, 'macro') ? immSet(s, 'outputs', immReplaceAt(immPadTo(s.outputs, i + 1, () => createDefaultExpr('unset', ctx)), i, expr)) : s)} paramTypes={['variable']} ctx={ctx} />)}
                    </> : <>
                        {step.inputs.map((input, i) => <ExpressionField key={i} label={`Input ${String(i)}`} value={input} setValue={expr => setStep(s => isStepType(s, 'macro') ? immSet(s, 'inputs', immReplaceAt(s.inputs, i, expr)) : s)} paramTypes={null} ctx={ctx} />)}
                        {step.outputs.map((output, i) => <ExpressionField key={i} label={`Output ${String(i)}`} value={output} setValue={expr => setStep(s => isStepType(s, 'macro') ? immSet(s, 'outputs', immReplaceAt(s.outputs, i, expr)) : s)} paramTypes={['variable']} ctx={ctx} />)}
                    </>}
                </>
            }
            case 'returnTo': return <>
                <StepField label='Target Step' value={step.stepID} setValue={stepID => setStep(s => isStepType(s, 'returnTo') ? immSet(s, 'stepID', stepID) : s)} steps={steps} setSteps={setSteps} selected={selected} setSelected={setSelected} />
            </>
            case 'goto': return <>
                <ExpressionField label='Scene' value={step.scene} setValue={expr => setStep(s => isStepType(s, 'goto') ? immSet(s, 'scene', expr) : s)} paramTypes={['scene']} ctx={ctx} />
            </>
            case 'error': return <>
                <ExpressionField label='Message' value={step.message} setValue={expr => setStep(s => isStepType(s, 'error') ? immSet(s, 'message', expr) : s)} paramTypes={['string']} ctx={ctx} />
            </>
            default: assertExhaustive(step, `Unhandled step type ${JSON.stringify(step)}`)
        }
    })

    return <div className={styles.stepEditor}>
        {getDeveloperMode() ? <>
            <StringField label='Step ID' value={step.id} />
            <StringField label='Step Type' value={getStepTypeLabel(step.type)} />
        </> : null}
        {subEditor()}
        {!readonly ? <Field label='Delete Step'>
            <EditorIcon path={COMMON_ICONS.deleteItem} label='Delete Step' onClick={onDeleteStep} />
        </Field> : null}
    </div>
}

const StepGap = ({ before, after, setSteps, rootSteps, setRootSteps }: { before: StepID | null, after: StepID | null, setSteps: (setter: (steps: AnyStep[]) => AnyStep[]) => void, rootSteps: AnyStep[], setRootSteps: (setter: (steps: AnyStep[]) => AnyStep[]) => void }) => {
    const [dropProps, dragOver] = useDrop('move', useCallback(values => {
        if (values.type === 'json') {
            const parsed = tryParseValue(values.value, 'step', parseAnyStep)
            if (parsed.success) {
                const deepStep = getDeepStep(parsed.value.id, rootSteps, setRootSteps, [], null)
                if (deepStep) {
                    deepStep.deleteStep()
                    setSteps(s => {
                        let index = s.findIndex(step => step.id === after)
                        if (index <= 0) index = s.findIndex(step => step.id === before) + 1
                        return immInsertAt(s, index, deepStep.step)
                    })
                }
            }
        }
    }, [rootSteps, setRootSteps, setSteps, after, before]))
    return <div {...dropProps} className={classes(styles.stepGap, { [styles.dragOver ?? '']: dragOver })}>
        <div className={styles.stepLine} />
    </div>
}

const StepList = ({ steps, setSteps, selected, setSelected, ctx, rootSteps, setRootSteps }: { steps: AnyStep[], setSteps: (setter: (steps: AnyStep[]) => AnyStep[]) => void, selected: StepID | null, setSelected: (id: StepID | null) => void, ctx: ExprContext, rootSteps: AnyStep[], setRootSteps: (setter: (steps: AnyStep[]) => AnyStep[]) => void }) => {
    const readonly = useProjectReadonly()
    const [dropdownProps, openDropdown] = useDropdownMenuState()

    const onAddStep = (e: React.MouseEvent, type: StepType) => {
        e.stopPropagation()
        const [project, id] = immGenerateID<StepID>(projectStore.getSnapshot())
        projectStore.setValue(() => project)
        setSteps(steps => immAppend(steps, createStep(id, type, ctx)))
        setSelected(id)
    }

    return <div className={styles.timeline}>
        <StepGap before={null} after={arrayHead(steps)?.id ?? null} setSteps={setSteps} rootSteps={rootSteps} setRootSteps={setRootSteps} />
        {steps.map((s, i) => <Fragment key={s.id}>
            <StepBubble key={s.id} step={s} setStep={setter => setSteps(steps => immReplaceAt(steps, i, setter(throwIfNull(steps[i]))))} deleteStep={() => setSteps(steps => immRemoveAt(steps, i))} selected={selected} setSelected={setSelected} ctx={ctx} rootSteps={rootSteps} setRootSteps={setRootSteps} />
            <StepGap before={s.id} after={steps[i + 1]?.id ?? null} setSteps={setSteps} rootSteps={rootSteps} setRootSteps={setRootSteps} />
        </Fragment>)}
        {!readonly ? <div className={styles.outlineBubble} onClick={openDropdown}>
            <EditorIcon path={COMMON_ICONS.addItem} />
        </div> : null}
        <SearchDropdownMenu items={STEP_TYPES} filter={(t, search) => t.toLowerCase().includes(search.toLowerCase())} {...dropdownProps}>
            {(type) => <DropdownMenuItem key={type} onClick={e => (onAddStep(e, type), dropdownProps.onClose())}>
                <EditorIcon path={STEP_ICONS[type]} label={getStepTypeLabel(type)} />
                <span>{getStepTypeLabel(type)}</span>
            </DropdownMenuItem>}
        </SearchDropdownMenu>
    </div>
}

const StepBubble = ({ step, setStep, selected, setSelected, ctx, rootSteps, setRootSteps }: { step: AnyStep, setStep: (setter: (step: AnyStep) => AnyStep) => void, deleteStep: () => void, selected: StepID | null, setSelected: (id: StepID | null) => void, ctx: ExprContext, rootSteps: AnyStep[], setRootSteps: (setter: (steps: AnyStep[]) => AnyStep[]) => void }) => {
    const [dragProps, dragging] = useDrag(step)

    const onSelect = (e: React.MouseEvent) => {
        e.stopPropagation()
        setSelected(step.id)
    }

    const isEndPoint = step.type === 'goto' || step.type === 'returnTo'

    const getPreview = () => {
        try {
            switch (step.type) {
                case 'text': {
                    const speakerID = resolveExprAs(step.speaker, 'character', ctx).value
                    const speaker = ctx.resolvers.character(speakerID)
                    if (!speaker) break
                    const text = resolveExprAs(step.text, 'string', ctx).value
                    return <>{getEntityEditorDisplayName('character', speaker)}:<br />{text.substring(0, 10)}...</>
                }
                case 'narrate': {
                    const text = resolveExprAs(step.text, 'string', ctx).value
                    return <>{text.substring(0, 10)}...</>
                }
                case 'enter': {
                    return getEntityEditorDisplayNameByID('character', resolveExprAs(step.character, 'character', ctx).value)
                }
                case 'move': {
                    return getEntityEditorDisplayNameByID('character', resolveExprAs(step.character, 'character', ctx).value)
                }
                case 'exit': {
                    return getEntityEditorDisplayNameByID('character', resolveExprAs(step.character, 'character', ctx).value)
                }
                case 'portrait': {
                    const characterID = resolveExprAs(step.character, 'character', ctx).value
                    const character = ctx.resolvers.character(characterID)
                    if (!character) break
                    const portraitID = resolveExprAs(step.portrait, 'portrait', ctx).value
                    const portrait = ctx.resolvers.portrait(portraitID)
                    if (!portrait) break
                    return <>{getEntityEditorDisplayName('character', character)}<br />{getEntityDisplayName('portrait', portrait, false)}</>
                }
                case 'backdrop': {
                    const backdropID = resolveExprAs(step.backdrop, 'backdrop', ctx).value
                    const backdrop = ctx.resolvers.backdrop(backdropID)
                    if (!backdrop) break
                    return getEntityEditorDisplayName('backdrop', backdrop)
                }
                case 'music': {
                    const songID = resolveExprAs(step.song, 'song', ctx).value
                    const song = ctx.resolvers.song(songID)
                    if (!song) break
                    return getEntityEditorDisplayName('song', song)
                }
                case 'sound': {
                    const soundID = resolveExprAs(step.sound, 'sound', ctx).value
                    const sound = ctx.resolvers.sound(soundID)
                    if (!sound) break
                    return getEntityEditorDisplayName('sound', sound)
                }
                case 'goto': {
                    const sceneID = resolveExprAs(step.scene, 'scene', ctx).value
                    const scene = ctx.resolvers.scene(sceneID)
                    if (!scene) break
                    return getEntityEditorDisplayName('scene', scene)
                }
                case 'set': {
                    const variableID = resolveExprAs(step.variable, 'variable', ctx).value
                    const variable = ctx.resolvers.variable(variableID)
                    if (!variable) break
                    return getEntityEditorDisplayName('variable', variable)
                }
                case 'setCharacter': {
                    const characterID = resolveExprAs(step.character, 'character', ctx).value
                    const character = ctx.resolvers.character(characterID)
                    if (!character) break
                    const variableID = resolveExprAs(step.variable, 'variable', ctx).value
                    const variable = ctx.resolvers.variable(variableID)
                    if (!variable) break
                    return <>{getEntityEditorDisplayName('character', character)}<br />{getEntityEditorDisplayName('variable', variable)}</>
                }
                case 'macro': {
                    const macroID = resolveExprAs(step.macro, 'macro', ctx).value
                    const macro = ctx.resolvers.macro(macroID)
                    if (!macro) break
                    return getEntityEditorDisplayName('macro', macro)
                }
                default: break
            }
            return <></>
        } catch (err) {
            return <EditorIcon path={COMMON_ICONS.warning} label={String(err)} />
        }
    }

    switch (step.type) {
        case 'decision':
        case 'branch':
            return <div className={classes(styles.bubble, { [styles.active ?? '']: selected === step.id, [styles.dragging ?? '']: dragging })}>
                <div {...dragProps} className={styles.bubbleFront} onClick={onSelect}>
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
                <div {...dragProps} className={styles.bubbleBack} onClick={onSelect}>

                </div>
            </div>
        default:
            return <div {...dragProps} className={classes(styles.simpleBubble, selected === step.id && styles.active, dragging && styles.dragging, isEndPoint && styles.end)} onClick={onSelect}>
                <EditorIcon path={STEP_ICONS[step.type]} label={getStepTypeLabel(step.type)} />
                <span className={styles.bubblePreview}>{getPreview()}</span>
            </div>
    }
}

export const StepSequenceEditor = ({ steps, setSteps, ctx }: { steps: AnyStep[], setSteps: (setter: (steps: AnyStep[]) => AnyStep[]) => void, ctx: ExprContext }) => {
    const [autoPlay, setAutoPlay] = useState(false)

    const getEditorState = useSelector(viewStateStore, s => s.editor?.type === 'sceneSteps' || s.editor?.type === 'macroSteps' ? s.editor : null)
    const getSelectedStepID = useCallback(() => getEditorState()?.stepID ?? null, [getEditorState])
    const setSelectedStepID = useCallback((value: StepID | null) => {
        viewStateStore.setValue(s => immSet(s, 'editor', s.editor?.type === 'sceneSteps' || s.editor?.type === 'macroSteps' ? immSet(s.editor, 'stepID', value) : s.editor))
    }, [])

    const selected = useMemo(() => getDeepStep(getSelectedStepID(), steps, setSteps, [], null), [getSelectedStepID, steps, setSteps])

    const sceneState: ScenePlayerState = useMemo(() => {
        let state = getInitialScenePlayerState({ musicVolume: 0, soundVolume: 1, uiVolume: 1, textSpeed: 1 })
        if (!selected) return state

        const previousSteps = selected.previousSteps.flatMap(s => {
            if (s.type === 'decision' && s.options.length) {
                return [s, ...throwIfNull(arrayTail(s.options)).steps]
            } else if (s.type === 'branch' && s.options.length) {
                return [s, ...throwIfNull(arrayTail(s.options)).steps]
            }
            return [s]
        })

        state = previousSteps.reduce((p, c) => {
            try {
                return applyStepToScenePlayerState(p, c, ctx)
            } catch (err) {
                void platform.error(err)
                return p
            }
        }, state)

        try {
            state = applyStepToScenePlayerState(state, selected.step, ctx)
            return state
        } catch (err) {
            void platform.error(err)
            return state
        }
    }, [ctx, selected])

    const onAdvance = useCallback(() => {
        if (selected && selected.step.type === 'returnTo') {
            setSelectedStepID(selected.step.stepID)
        } else if (selected && selected.step.type === 'branch') {
            setSelectedStepID(arrayTail(selected.step.options)?.steps[0]?.id ?? selected.nextStep?.id ?? null)
        } else if (selected && selected.nextStep) {
            setSelectedStepID(selected.nextStep.id)
            setAutoPlay(true)
        }
    }, [selected, setSelectedStepID])

    const onSelectOption = (index: number) => {
        if (selected && selected.step.type === 'decision') {
            setSelectedStepID(selected.step.options[index]?.steps[0]?.id ?? selected.nextStep?.id ?? null)
        }
    }

    const onSubmitPrompt = (promptValue: string) => {
        onAdvance()
    }

    const onRandomizePrompt = () => {
        // Not implemented
    }

    useEffect(() => {
        if (!autoPlay) return
        switch (selected?.step.type) {
            case 'backdrop':
            case 'enter':
            case 'exit':
            case 'move':
            case 'portrait':
            case 'set':
            case 'branch':
            case 'returnTo':
            case 'goto':
            case 'music':
            case 'sound':
            case 'macro':
                onAdvance()
                break
            default:
                break
        }
    }, [selected?.step, onAdvance, autoPlay])

    const onRestartClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        setSelectedStepID(steps[0]?.id ?? null)
        setAutoPlay(true)
    }, [setSelectedStepID, steps])

    const onAutoPlayClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        if (!selected) {
            setSelectedStepID(steps[0]?.id ?? null)
        }
        setAutoPlay(v => !v)
    }, [selected, steps, setSelectedStepID])

    const onCloseClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        viewStateStore.setValue(s => immSet(s, 'editor', null))
    }, [])

    return <div className={styles.sequenceEditor}>
        <div className={styles.player}>
            <ScenePlayer state={sceneState} onAdvance={onAdvance} onSelectOption={onSelectOption} onSubmitPrompt={onSubmitPrompt} onRandomizePrompt={onRandomizePrompt} />
        </div>
        <div className={styles.playerIcons}>
            <PlayerIcon path={COMMON_ICONS.restart} onClick={onRestartClick} />
            <PlayerIcon path={autoPlay ? COMMON_ICONS.pause : COMMON_ICONS.play} onClick={onAutoPlayClick} />
            <PlayerIcon path={COMMON_ICONS.close} onClick={onCloseClick} />
        </div>
        <div className={styles.timeline}>
            <StepList steps={steps} setSteps={setSteps} selected={getSelectedStepID()} setSelected={setSelectedStepID} ctx={ctx} rootSteps={steps} setRootSteps={setSteps} />
        </div>
        {selected ? <StepEditor key={selected.step.id} step={selected.step} setStep={selected.setStep} deleteStep={selected.deleteStep} steps={steps} setSteps={setSteps} selected={getSelectedStepID()} setSelected={setSelectedStepID} ctx={ctx} /> : null}
    </div>
}


export const StepSequenceField = ({ steps, setSteps, ctx }: { steps: AnyStep[], setSteps: (setter: (steps: AnyStep[]) => AnyStep[]) => void, ctx: ExprContext }) => {
    const [selectedStepID, setSelectedStepID] = useState<StepID | null>(null)

    const selected = useMemo(() => getDeepStep(selectedStepID, steps, setSteps, [], null), [selectedStepID, setSteps, steps])

    return <div className={classes(styles.sequenceEditor, styles.field)}>
        <div className={styles.timeline}>
            <StepList steps={steps} setSteps={setSteps} selected={selectedStepID} setSelected={setSelectedStepID} ctx={ctx} rootSteps={steps} setRootSteps={setSteps} />
        </div>
        {selected ? <StepEditor key={selected.step.id} step={selected.step} setStep={selected.setStep} deleteStep={selected.deleteStep} steps={steps} setSteps={setSteps} selected={selectedStepID} setSelected={setSelectedStepID} ctx={ctx} /> : null}
    </div>
}
