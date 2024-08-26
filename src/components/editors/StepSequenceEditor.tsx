import { useCallback, useMemo, useState } from "react"
import { AnyStep, createStep, isStepType, StepID } from "../../types/steps"
import { immAppend, immRemoveAt, immReplaceAt, immReplaceBy, immSet } from "../../utils/imm"
import { EditorIcon } from "../common/EditorIcon"
import { COMMON_ICONS, STEP_ICONS } from "../common/Icons"
import { ExpressionEditor, ExpressionField } from "./ExpressionEditor"
import styles from './StepSequenceEditor.module.css'
import { StringField } from "../common/StringField"
import { prettyPrintIdentifier } from "../../utils/display"
import { ExprContext } from "../../types/expressions"
import { getProjectExprContext } from "../../store/project"

const StepEditor = ({ step, setStep, ctx }: { step: AnyStep, setStep: (setter: (step: AnyStep) => AnyStep) => void, deleteStep: () => void, ctx: ExprContext }) => {
    return <div className={styles.stepEditor}>
        <StringField label="Step ID" value={step.id} />
        <StringField label="Step Type" value={prettyPrintIdentifier(step.type)} />
        {step.type === 'text' ? <>
            <ExpressionField label="Speaker" value={step.speaker} setValue={expr => setStep(s => isStepType(s, 'text') ? immSet(s, 'speaker', expr) : s)} paramTypes={['character']} ctx={ctx} />
            <ExpressionField label="Text" value={step.text} setValue={expr => setStep(s => isStepType(s, 'text') ? immSet(s, 'text', expr) : s)} paramTypes={['string']} ctx={ctx} />
        </> : step.type === 'backdrop' ? <>
            <ExpressionField label="Backdrop" value={step.backdrop} setValue={expr => setStep(s => isStepType(s, 'backdrop') ? immSet(s, 'backdrop', expr) : s)} paramTypes={['backdrop']} ctx={ctx} />
        </> : step.type === 'enter' ? <>
            <ExpressionField label="Character" value={step.character} setValue={expr => setStep(s => isStepType(s, 'enter') ? immSet(s, 'character', expr) : s)} paramTypes={['character']} ctx={ctx} />
            <ExpressionField label="Portrait" value={step.portrait} setValue={expr => setStep(s => isStepType(s, 'enter') ? immSet(s, 'portrait', expr) : s)} paramTypes={['portrait']} ctx={ctx} />
            <ExpressionField label="Location" value={step.location} setValue={expr => setStep(s => isStepType(s, 'enter') ? immSet(s, 'location', expr) : s)} paramTypes={['location']} ctx={ctx} />
        </> : step.type === 'exit' ? <>
            <ExpressionField label="Character" value={step.character} setValue={expr => setStep(s => isStepType(s, 'enter') ? immSet(s, 'character', expr) : s)} paramTypes={['character']} ctx={ctx} />
            <ExpressionField label="Location" value={step.location} setValue={expr => setStep(s => isStepType(s, 'enter') ? immSet(s, 'location', expr) : s)} paramTypes={['location']} ctx={ctx} />
        </> : step.type === 'move' ? <>
            <ExpressionField label="Character" value={step.character} setValue={expr => setStep(s => isStepType(s, 'move') ? immSet(s, 'character', expr) : s)} paramTypes={['character']} ctx={ctx} />
            <ExpressionField label="Location" value={step.location} setValue={expr => setStep(s => isStepType(s, 'move') ? immSet(s, 'location', expr) : s)} paramTypes={['location']} ctx={ctx} />
        </> : step.type === 'portrait' ? <>
            <ExpressionField label="Character" value={step.character} setValue={expr => setStep(s => isStepType(s, 'portrait') ? immSet(s, 'character', expr) : s)} paramTypes={['character']} ctx={ctx} />
            <ExpressionField label="Portrait" value={step.portrait} setValue={expr => setStep(s => isStepType(s, 'portrait') ? immSet(s, 'portrait', expr) : s)} paramTypes={['portrait']} ctx={ctx} />
        </> : step.type === 'music' ? <>
            <ExpressionField label="Song" value={step.song} setValue={expr => setStep(s => isStepType(s, 'music') ? immSet(s, 'song', expr) : s)} paramTypes={['song']} ctx={ctx} />
        </> : step.type === 'sound' ? <>
            <ExpressionField label="Sound" value={step.sound} setValue={expr => setStep(s => isStepType(s, 'sound') ? immSet(s, 'sound', expr) : s)} paramTypes={['sound']} ctx={ctx} />
        </> : step.type === 'decision' ? <>
            {step.options.map((o, i) => <div key={i} className="optionEditor">
                <ExpressionField label="Condition" value={o.condition} setValue={expr => setStep(s => isStepType(s, 'decision') ? immSet(s, 'options', immReplaceAt(s.options, i, immSet(s.options[i], 'condition', expr))) : s)} paramTypes={['boolean']} ctx={ctx} />
                <ExpressionField label="Text" value={o.text} setValue={expr => setStep(s => isStepType(s, 'decision') ? immSet(s, 'options', immReplaceAt(s.options, i, immSet(s.options[i], 'text', expr))) : s)} paramTypes={['string']} ctx={ctx} />
            </div>)}
        </> : step.type === 'branch' ? <>
            {step.options.map((o, i) => <div key={i} className="optionEditor">
                <ExpressionField label="Condition" value={o.condition} setValue={expr => setStep(s => isStepType(s, 'decision') ? immSet(s, 'options', immReplaceAt(s.options, i, immSet(s.options[i], 'condition', expr))) : s)} paramTypes={['boolean']} ctx={ctx} />
            </div>)}
        </> : step.type === 'set' ? <>
            <ExpressionField label="Variable" value={step.variable} setValue={expr => setStep(s => isStepType(s, 'set') ? immSet(s, 'variable', expr) : s)} paramTypes={['variable']} ctx={ctx} />
            <ExpressionField label="Value" value={step.value} setValue={expr => setStep(s => isStepType(s, 'set') ? immSet(s, 'value', expr) : s)} paramTypes={null} ctx={ctx} />
        </> : step.type === 'macro' ? <>
            <ExpressionField label="Macro" value={step.macro} setValue={expr => setStep(s => isStepType(s, 'macro') ? immSet(s, 'macro', expr) : s)} paramTypes={['macro']} ctx={ctx} />
            {step.inputs.map((input, i) => <ExpressionField key={i} label={`Input ${i}`} value={input} setValue={expr => setStep(s => isStepType(s, 'macro') ? immSet(s, 'inputs', immReplaceAt(s.inputs, i, expr)) : s)} paramTypes={null} ctx={ctx} />)}
            {step.outputs.map((output, i) => <ExpressionField key={i} label={`Output ${i}`} value={output} setValue={expr => setStep(s => isStepType(s, 'macro') ? immSet(s, 'outputs', immReplaceAt(s.outputs, i, expr)) : s)} paramTypes={['variable']} ctx={ctx} />)}
        </> : null}
    </div>
}

const StepList = ({ steps, setSteps, selected, setSelected, ctx }: { steps: AnyStep[], setSteps: (setter: (steps: AnyStep[]) => AnyStep[]) => void, selected: StepID, setSelected: (id: StepID) => void, ctx: ExprContext }) => {

    const onAddStep = (e: React.MouseEvent) => {
        e.stopPropagation()
        setSteps(steps => immAppend(steps, createStep('text', ctx)))
    }

    return <div className={styles.timeline}>
        {steps.map((s, i) => <StepBubble key={s.id} step={s} setStep={setter => setSteps(steps => immReplaceAt(steps, i, setter(steps[i])))} deleteStep={() => setSteps(steps => immRemoveAt(steps, i))} selected={selected} setSelected={setSelected} ctx={ctx} />)}
        <div className={styles.outlineBubble} onClick={onAddStep}>
            <EditorIcon path={COMMON_ICONS.addItem} />
        </div>
    </div>
}

const StepBubble = ({ step, setStep, selected, setSelected, ctx }: { step: AnyStep, setStep: (setter: (step: AnyStep) => AnyStep) => void, deleteStep: () => void, selected: StepID, setSelected: (id: StepID) => void, ctx: ExprContext }) => {

    const onSelect = (e: React.MouseEvent) => {
        e.stopPropagation()
        setSelected(step.id)
    }

    return step.type === 'decision' || step.type === 'branch' ? <div className={styles.bubble}>
        <div className={styles.bubbleFront} onClick={onSelect}>
            <EditorIcon path={STEP_ICONS[step.type]} />
        </div>
        <div className={styles.bubbleBody}>
            {step.type === 'decision' ? <>
                {step.options.map((o, i) => <div key={i} className={styles.bubbleBodyRow}>
                    <div className={styles.option}>
                        <ExpressionEditor expr={o.condition} setExpr={expr => setStep(s => isStepType(s, 'decision') ? immSet(s, 'options', immReplaceAt(s.options, i, immSet(s.options[i], 'condition', expr))) : s)} paramTypes={['boolean']} ctx={ctx} />
                        <ExpressionEditor expr={o.text} setExpr={expr => setStep(s => isStepType(s, 'decision') ? immSet(s, 'options', immReplaceAt(s.options, i, immSet(s.options[i], 'text', expr))) : s)} paramTypes={['string']} ctx={ctx} />
                    </div>
                    <StepList steps={o.steps} setSteps={setter => setStep(s => isStepType(s, 'decision') ? immSet(s, 'options', immReplaceAt(s.options, i, immSet(s.options[i], 'steps', setter(s.options[i].steps)))) : s)} selected={selected} setSelected={setSelected} ctx={ctx} />
                </div>)}
            </> : step.type === 'branch' ? <>
                {step.options.map((o, i) => <div key={i} className={styles.bubbleBodyRow}>
                    <div className={styles.option}>
                        <ExpressionEditor expr={o.condition} setExpr={expr => setStep(s => isStepType(s, 'branch') ? immSet(s, 'options', immReplaceAt(s.options, i, immSet(s.options[i], 'condition', expr))) : s)} ctx={ctx} />
                    </div>
                    <StepList steps={o.steps} setSteps={setter => setStep(s => isStepType(s, 'branch') ? immSet(s, 'options', immReplaceAt(s.options, i, immSet(s.options[i], 'steps', setter(s.options[i].steps)))) : s)} selected={selected} setSelected={setSelected} ctx={ctx} />
                </div>)}
            </> : null}
        </div>
        <div className={styles.bubbleBack}>

        </div>
    </div> : <div className={styles.simpleBubble} onClick={onSelect}>
        <EditorIcon path={STEP_ICONS[step.type]} label={prettyPrintIdentifier(step.type)} />
    </div>
}

export const StepSequenceEditor = ({ steps, setSteps }: { steps: AnyStep[], setSteps: (setter: (steps: AnyStep[]) => AnyStep[]) => void }) => {
    const [selectedStepID, setSelectedStepID] = useState<StepID>('' as StepID)

    const ctx = getProjectExprContext()

    const getSelectedStep = useCallback((stepID: StepID, steps: AnyStep[], setSteps: (setter: (steps: AnyStep[]) => AnyStep[]) => void): [AnyStep, (setter: (step: AnyStep) => AnyStep) => void, () => void] | [null, null, null] => {
        const index = steps.findIndex(s => s.id === stepID)
        if (index >= 0) {
            return [steps[index], setter => setSteps(steps => immReplaceAt(steps, index, setter(steps[index]))), () => setSteps(steps => immRemoveAt(steps, index))]
        }
        for (const s of steps) {
            if (s.type === 'decision' || s.type === 'branch') {
                for (let i = 0; i < s.options.length; i++) {
                    const [step, setStep, deleteStep] = getSelectedStep(stepID, s.options[i].steps, setter => setSteps(steps => immReplaceBy(steps, s => s.id, immSet(s, 'options', immReplaceAt(s.options, i, immSet(s.options[i], 'steps', setter(s.options[i].steps)))))))
                    if (step && setStep) return [step, setStep, deleteStep]
                }
            }
        }
        return [null, null, null]
    }, [])

    const [selectedStep, setSelectedStep, deleteSelectedStep] = useMemo(() => getSelectedStep(selectedStepID, steps, setSteps), [getSelectedStep, selectedStepID, steps, setSteps])

    return <div className={styles.sequenceEditor}>
        {selectedStep && setSelectedStep ? <div className={styles.fields}>
            <StepEditor step={selectedStep} setStep={setSelectedStep} deleteStep={deleteSelectedStep} ctx={ctx} />
        </div> : null}
        <div className={styles.timeline}>
            <StepList steps={steps} setSteps={setSteps} selected={selectedStepID} setSelected={setSelectedStepID} ctx={ctx} />
        </div>
    </div>
}
