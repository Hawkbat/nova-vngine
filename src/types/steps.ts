import type { ParseFunc } from '../utils/guard'
import { defineParser, parsers as $ } from '../utils/guard'
import type { Branded } from '../utils/types'
import { assertExhaustive } from '../utils/types'
import type { AnyExpr, BackdropExpr, BooleanExpr, CharacterExpr, ExprContext, LocationExpr, MacroExpr, PortraitExpr, SceneExpr, SongExpr, SoundExpr, StringExpr, ValueExpr, VariableExpr } from './expressions'
import { createDefaultExpr, parseAnyExpr } from './expressions'

export type StepID = Branded<string, 'Step'>

type StepMap = {
    text: {
        text: StringExpr
        speaker: CharacterExpr
    }
    narrate: {
        text: StringExpr
        mode: 'adv' | 'nvl'
    }
    backdrop: {
        backdrop: BackdropExpr
        mode: 'replace' | 'append' | 'prepend'
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
    }
    set: {
        variable: VariableExpr
        value: ValueExpr
    }
    macro: {
        macro: MacroExpr
        inputs: AnyExpr[]
        outputs: VariableExpr[]
    }
    goto: {
        scene: SceneExpr
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
    macro: true,
    goto: true,
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
        case 'prompt': return validateStep('prompt', { id, type, label: '', variable: createDefaultExpr('variable', ctx), initialValue: createDefaultExpr('unset', ctx) }) as StepOfType<T>
        case 'set': return validateStep('set', { id, type, variable: createDefaultExpr('variable', ctx), value: createDefaultExpr('unset', ctx) }) as StepOfType<T>
        case 'macro': return validateStep('macro', { id, type, macro: createDefaultExpr('macro', ctx), inputs: [], outputs: [] }) as StepOfType<T>
        case 'goto': return validateStep('goto', { id, type, scene: createDefaultExpr('scene', ctx) }) as StepOfType<T>
        default: return assertExhaustive(type, `Could not create step of type ${JSON.stringify(type)}`)
    }
}

export const parseAnyStep: ParseFunc<AnyStep> = defineParser<AnyStep>((c, v, d) => $.typed(c, v, { id: $.id }, {
    text: { speaker: parseAnyExpr, text: parseAnyExpr },
    narrate: { text: parseAnyExpr, mode: (c, v, d) => $.enum(c, v, ['adv', 'nvl'], d) },
    backdrop: { backdrop: parseAnyExpr, mode: (c, v, d) => $.enum(c, v, ['replace', 'append', 'prepend'], d ?? 'replace') },
    enter: { character: parseAnyExpr, portrait: parseAnyExpr, location: parseAnyExpr },
    exit: { character: parseAnyExpr, location: parseAnyExpr },
    move: { character: parseAnyExpr, location: parseAnyExpr },
    portrait: { character: parseAnyExpr, portrait: parseAnyExpr },
    music: { song: parseAnyExpr },
    sound: { sound: parseAnyExpr },
    decision: { options: (c, v, d) => $.array(c, v, (c, v, d) => $.object(c, v, { text: parseAnyExpr, condition: parseAnyExpr, steps: (c, v, d) => $.array(c, v, parseAnyStep, d) }, d), d) },
    branch: { options: (c, v, d) => $.array(c, v, (c, v, d) => $.object(c, v, { condition: parseAnyExpr, steps: (c, v, d) => $.array(c, v, parseAnyStep, d) }, d), d) },
    prompt: { label: $.string, variable: parseAnyExpr, initialValue: parseAnyExpr },
    set: { variable: parseAnyExpr, value: parseAnyExpr },
    macro: { macro: parseAnyExpr, inputs: (c, v, d) => $.array(c, v, parseAnyExpr, d), outputs: (c, v, d) => $.array(c, v, parseAnyExpr, d) },
    goto: { scene: parseAnyExpr },
}, d))
