import type { ParseFunc } from '../utils/guard'
import { defineParser, parsers as $, throwIfNull } from '../utils/guard'
import { immReplaceAt, immReplaceBy, immSet } from '../utils/imm'
import type { Branded } from '../utils/types'
import { assertExhaustive } from '../utils/types'
import type { AnyExpr, BackdropExpr, BooleanExpr, CharacterExpr, ExprContext, LocationExpr, MacroExpr, PortraitExpr, SceneExpr, SongExpr, SoundExpr, StringExpr, ValueExpr, VariableExpr } from './expressions'
import { createDefaultExpr, parseAnyExpr, prettyPrintExpr } from './expressions'

export type StepID = Branded<string, 'Step'>

type StepMap = {
    text: {
        text: StringExpr
        speaker: CharacterExpr
    }
    narrate: {
        text: StringExpr
        mode: 'adv' | 'nvl' | 'pop'
    }
    backdrop: {
        backdrop: BackdropExpr
        mode: 'replace' | 'append' | 'prepend' | 'remove'
    }
    enter: {
        character: CharacterExpr
        portrait: PortraitExpr
        location: LocationExpr
    }
    exit: {
        character: CharacterExpr
        location: LocationExpr
    }
    move: {
        character: CharacterExpr
        location: LocationExpr
    }
    portrait: {
        character: CharacterExpr
        portrait: PortraitExpr
    }
    music: {
        song: SongExpr
    }
    sound: {
        sound: SoundExpr
    }
    decision: {
        options: {
            text: StringExpr
            condition: BooleanExpr
            steps: AnyStep[]
        }[]
    }
    branch: {
        options: {
            condition: BooleanExpr
            steps: AnyStep[]
        }[]
    }
    prompt: {
        label: string
        variable: VariableExpr
        initialValue: ValueExpr
        randomValue: ValueExpr
    }
    set: {
        variable: VariableExpr
        value: ValueExpr
    }
    setCharacter: {
        character: CharacterExpr
        variable: VariableExpr
        value: ValueExpr
    }
    macro: {
        macro: MacroExpr
        inputs: AnyExpr[]
        outputs: VariableExpr[]
    }
    returnTo: {
        stepID: StepID
    }
    goto: {
        scene: SceneExpr
    }
    error: {
        message: ValueExpr
    }
}

const STEP_TYPE_MAP = {
    text: true,
    narrate: true,
    backdrop: true,
    enter: true,
    exit: true,
    move: true,
    portrait: true,
    music: true,
    sound: true,
    decision: true,
    branch: true,
    prompt: true,
    set: true,
    setCharacter: true,
    macro: true,
    returnTo: true,
    goto: true,
    error: true,
} satisfies Record<StepType, true>

export const STEP_TYPES = Object.keys(STEP_TYPE_MAP) as StepType[]

export type StepType = keyof StepMap
export type StepOfType<T extends StepType> = T extends StepType ? { id: StepID, type: T } & StepMap[T] : never
export type AnyStep = StepOfType<StepType>

export function isStepType<T extends StepType>(step: AnyStep, type: T): step is StepOfType<T> {
    return step.type === type
}

function validateStep<T extends StepType>(type: T, step: StepOfType<T>) {
    return step
}

export function createStep<T extends StepType>(id: StepID, type: T, ctx: ExprContext): StepOfType<T> {
    switch (type) {
        case 'text': return validateStep('text', { id, type, text: createDefaultExpr('string', ctx), speaker: createDefaultExpr('character', ctx) }) as StepOfType<T>
        case 'narrate': return validateStep('narrate', { id, type, text: createDefaultExpr('string', ctx), mode: 'adv' }) as StepOfType<T>
        case 'backdrop': return validateStep('backdrop', { id, type, backdrop: createDefaultExpr('backdrop', ctx), mode: 'replace' }) as StepOfType<T>
        case 'enter': return validateStep('enter', { id, type, character: createDefaultExpr('character', ctx), portrait: createDefaultExpr('portrait', ctx), location: createDefaultExpr('location', ctx) }) as StepOfType<T>
        case 'exit': return validateStep('exit', { id, type, character: createDefaultExpr('character', ctx), location: createDefaultExpr('location', ctx) }) as StepOfType<T>
        case 'move': return validateStep('move', { id, type, character: createDefaultExpr('character', ctx), location: createDefaultExpr('location', ctx) }) as StepOfType<T>
        case 'portrait': return validateStep('portrait', { id, type, character: createDefaultExpr('character', ctx), portrait: createDefaultExpr('portrait', ctx) }) as StepOfType<T>
        case 'music': return validateStep('music', { id, type, song: createDefaultExpr('song', ctx) }) as StepOfType<T>
        case 'sound': return validateStep('sound', { id, type, sound: createDefaultExpr('sound', ctx) }) as StepOfType<T>
        case 'decision': return validateStep('decision', { id, type, options: [{ text: createDefaultExpr('string', ctx), condition: createDefaultExpr('boolean', ctx), steps: [] }] }) as StepOfType<T>
        case 'branch': return validateStep('branch', { id, type, options: [{ condition: createDefaultExpr('boolean', ctx), steps: [] }] }) as StepOfType<T>
        case 'prompt': return validateStep('prompt', { id, type, label: '', variable: createDefaultExpr('variable', ctx), initialValue: createDefaultExpr('unset', ctx), randomValue: createDefaultExpr('unset', ctx) }) as StepOfType<T>
        case 'set': return validateStep('set', { id, type, variable: createDefaultExpr('variable', ctx), value: createDefaultExpr('unset', ctx) }) as StepOfType<T>
        case 'setCharacter': return validateStep('setCharacter', { id, type, character: createDefaultExpr('character', ctx), variable: createDefaultExpr('variable', ctx), value: createDefaultExpr('unset', ctx) }) as StepOfType<T>
        case 'macro': return validateStep('macro', { id, type, macro: createDefaultExpr('macro', ctx), inputs: [], outputs: [] }) as StepOfType<T>
        case 'returnTo': return validateStep('returnTo', { id, type, stepID: '' as StepID }) as StepOfType<T>
        case 'goto': return validateStep('goto', { id, type, scene: createDefaultExpr('scene', ctx) }) as StepOfType<T>
        case 'error': return validateStep('error', { id, type, message: createDefaultExpr('string', ctx) }) as StepOfType<T>
        default: return assertExhaustive(type, `Could not create step of type ${JSON.stringify(type)}`)
    }
}

export function getDeepStep(stepID: StepID | null, steps: AnyStep[], setSteps: (setter: (steps: AnyStep[]) => AnyStep[]) => void, previousSteps: AnyStep[], nextStep: AnyStep | null): {
    step: AnyStep
    setStep: (setter: (step: AnyStep) => AnyStep) => void
    deleteStep: () => void
    previousSteps: AnyStep[]
    nextStep: AnyStep | null
} | null {
    if (!stepID) return null
    const index = steps.findIndex(s => s.id === stepID)
    if (index >= 0) {
        return {
            step: throwIfNull(steps[index]),
            setStep: setter => setSteps(steps => immReplaceAt(steps, index, setter(throwIfNull(steps[index])))),
            deleteStep: () => setSteps(steps => steps.filter(s => s.id !== stepID)),
            previousSteps: previousSteps.concat(steps.slice(0, index)),
            nextStep: steps[index + 1] ?? nextStep,
        }
    }
    for (const s of steps) {
        if (s.type === 'decision' || s.type === 'branch') {
            const index = steps.findIndex(o => s.id === o.id)
            for (let i = 0; i < s.options.length; i++) {
                const result = getDeepStep(stepID, throwIfNull(s.options[i]).steps, setter => setSteps(steps => immReplaceBy(steps, s => s.id, immSet(s, 'options', immReplaceAt(s.options, i, immSet(throwIfNull(s.options[i]), 'steps', setter(throwIfNull(s.options[i]).steps)))))), previousSteps.concat(steps.slice(0, steps.findIndex(o => o.id === s.id))), steps[index + 1] ?? null)
                if (result) return result
            }
        }
    }
    return null
}

export function prettyPrintStep(step: AnyStep, ctx: ExprContext) {
    let out = `${step.type}(`
    switch (step.type) {
        case 'text':
            out += `${prettyPrintExpr(step.speaker, ctx)}, `
            out += `${prettyPrintExpr(step.text, ctx)}, `
            break
        case 'narrate':
            out += `${step.mode.toUpperCase()}, `
            out += `${prettyPrintExpr(step.text, ctx)}, `
            break
        case 'backdrop':
            out += `${step.mode}, `
            out += `${prettyPrintExpr(step.backdrop, ctx)}, `
            break
        case 'enter':
            out += `${prettyPrintExpr(step.character, ctx)}, `
            out += `${prettyPrintExpr(step.portrait, ctx)}, `
            out += `${prettyPrintExpr(step.location, ctx)}, `
            break
        case 'exit':
            out += `${prettyPrintExpr(step.character, ctx)}, `
            out += `${prettyPrintExpr(step.location, ctx)}, `
            break
        case 'move':
            out += `${prettyPrintExpr(step.character, ctx)}, `
            out += `${prettyPrintExpr(step.location, ctx)}, `
            break
        case 'portrait':
            out += `${prettyPrintExpr(step.character, ctx)}, `
            out += `${prettyPrintExpr(step.portrait, ctx)}, `
            break
        case 'music':
            out += `${prettyPrintExpr(step.song, ctx)}, `
            break
        case 'sound':
            out += `${prettyPrintExpr(step.sound, ctx)}, `
            break
        case 'prompt':
            out += `${step.label}, `
            out += `${prettyPrintExpr(step.variable, ctx)}, `
            out += `${prettyPrintExpr(step.initialValue, ctx)}, `
            out += `${prettyPrintExpr(step.randomValue, ctx)}, `
            break
        case 'set':
            out += `${prettyPrintExpr(step.variable, ctx)}, `
            out += `${prettyPrintExpr(step.value, ctx)}, `
            break
        case 'setCharacter':
            out += `${prettyPrintExpr(step.character, ctx)}, `
            out += `${prettyPrintExpr(step.variable, ctx)}, `
            out += `${prettyPrintExpr(step.value, ctx)}, `
            break
        case 'returnTo':
            out += `${step.stepID}, `
            break
        case 'goto':
            out += `${prettyPrintExpr(step.scene, ctx)}, `
            break
        case 'error':
            out += `${prettyPrintExpr(step.message, ctx)}, `
            break
        case 'macro':
            out += `${prettyPrintExpr(step.macro, ctx)}, `
            out += `[${step.inputs.map(e => prettyPrintExpr(e, ctx)).join(', ')}], `
            out += `[${step.outputs.map(e => prettyPrintExpr(e, ctx)).join(', ')}], `
            break
        case 'decision':
            out += `[${step.options.map(o => `option(${prettyPrintExpr(o.text, ctx)}, ${prettyPrintExpr(o.condition, ctx)}, ${o.steps.map(s => prettyPrintStep(s, ctx)).join(', ')})`).join(', ')}]`
            break
        case 'branch':
            out += `[${step.options.map(o => `option(${prettyPrintExpr(o.condition, ctx)}, ${o.steps.map(s => prettyPrintStep(s, ctx)).join(', ')})`).join(', ')}]`
            break
    }
    if (out.endsWith(', ')) out = out.substring(0, out.length - 2)
    out += ')'
    return out
}

export const parseAnyStep: ParseFunc<AnyStep> = defineParser<AnyStep>((c, v, d) => $.typed(c, v, { id: $.id }, {
    text: { speaker: parseAnyExpr, text: parseAnyExpr },
    narrate: { text: parseAnyExpr, mode: (c, v, d) => $.enum(c, v, ['adv', 'nvl', 'pop'], d) },
    backdrop: { backdrop: parseAnyExpr, mode: (c, v, d) => $.enum(c, v, ['replace', 'append', 'prepend', 'remove'], d ?? 'replace') },
    enter: { character: parseAnyExpr, portrait: parseAnyExpr, location: parseAnyExpr },
    exit: { character: parseAnyExpr, location: parseAnyExpr },
    move: { character: parseAnyExpr, location: parseAnyExpr },
    portrait: { character: parseAnyExpr, portrait: parseAnyExpr },
    music: { song: parseAnyExpr },
    sound: { sound: parseAnyExpr },
    decision: { options: (c, v, d) => $.array(c, v, (c, v, d) => $.object(c, v, { text: parseAnyExpr, condition: parseAnyExpr, steps: (c, v, d) => $.array(c, v, parseAnyStep, d) }, d), d) },
    branch: { options: (c, v, d) => $.array(c, v, (c, v, d) => $.object(c, v, { condition: parseAnyExpr, steps: (c, v, d) => $.array(c, v, parseAnyStep, d) }, d), d) },
    prompt: { label: $.string, variable: parseAnyExpr, initialValue: parseAnyExpr, randomValue: parseAnyExpr },
    set: { variable: parseAnyExpr, value: parseAnyExpr },
    setCharacter: { character: parseAnyExpr, variable: parseAnyExpr, value: parseAnyExpr },
    macro: { macro: parseAnyExpr, inputs: (c, v, d) => $.array(c, v, parseAnyExpr, d), outputs: (c, v, d) => $.array(c, v, parseAnyExpr, d) },
    returnTo: { stepID: $.id },
    goto: { scene: parseAnyExpr },
    error: { message: parseAnyExpr },
}, d))
