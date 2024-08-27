import { projectStore } from "../store/project"
import { immGenerateID } from "../store/operations"
import type { Branded } from "../utils/types"
import { assertExhaustive } from "../utils/types"
import type { StringExpr, CharacterExpr, BackdropExpr, LocationExpr, SongExpr, SoundExpr, BooleanExpr, VariableExpr, ValueExpr, PortraitExpr, AnyExpr, ExprContext, MacroExpr } from "./expressions"
import { createDefaultExpr } from "./expressions"

export type StepID = Branded<string, 'Step'>

type StepMap = {
    text: {
        text: StringExpr
        speaker: CharacterExpr
    }
    backdrop: {
        backdrop: BackdropExpr
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
    set: {
        variable: VariableExpr
        value: ValueExpr
    }
    macro: {
        macro: MacroExpr
        inputs: AnyExpr[]
        outputs: VariableExpr[]
    }
}

export type StepType = keyof StepMap
export type StepOfType<T extends StepType> = T extends StepType ? { id: StepID, type: T } & StepMap[T] : never
export type AnyStep = StepOfType<StepType>

export function isStepType<T extends StepType>(step: AnyStep, type: T): step is StepOfType<T> {
    return step.type === type
}

function validateStep<T extends StepType>(type: T, step: StepOfType<T>) {
    return step
}

export function createStep<T extends StepType>(type: T, ctx: ExprContext): StepOfType<T> {
    const [project, id] = immGenerateID<StepID>(projectStore.getSnapshot())
    try {
        switch (type) {
            case 'text': return validateStep('text', { id, type, text: createDefaultExpr('string', ctx), speaker: createDefaultExpr('character', ctx) }) as StepOfType<T>
            case 'backdrop': return validateStep('backdrop', { id, type, backdrop: createDefaultExpr('backdrop', ctx) }) as StepOfType<T>
            case 'enter': return validateStep('enter', { id, type, character: createDefaultExpr('character', ctx), portrait: createDefaultExpr('portrait', ctx), location: createDefaultExpr('location', ctx) }) as StepOfType<T>
            case 'exit': return validateStep('exit', { id, type, character: createDefaultExpr('character', ctx), location: createDefaultExpr('location', ctx) }) as StepOfType<T>
            case 'move': return validateStep('move', { id, type, character: createDefaultExpr('character', ctx), location: createDefaultExpr('location', ctx) }) as StepOfType<T>
            case 'portrait': return validateStep('portrait', { id, type, character: createDefaultExpr('character', ctx), portrait: createDefaultExpr('portrait', ctx) }) as StepOfType<T>
            case 'music': return validateStep('music', { id, type, song: createDefaultExpr('song', ctx) }) as StepOfType<T>
            case 'sound': return validateStep('sound', { id, type, sound: createDefaultExpr('sound', ctx) }) as StepOfType<T>
            case 'decision': return validateStep('decision', { id, type, options: [{ text: createDefaultExpr('string', ctx), condition: createDefaultExpr('boolean', ctx), steps: [] }] }) as StepOfType<T>
            case 'branch': return validateStep('branch', { id, type, options: [{ condition: createDefaultExpr('boolean', ctx), steps: [] }] }) as StepOfType<T>
            case 'set': return validateStep('set', { id, type, variable: createDefaultExpr('variable', ctx), value: createDefaultExpr('unset', ctx) }) as StepOfType<T>
            case 'macro': return validateStep('macro', { id, type, macro: createDefaultExpr('macro', ctx), inputs: [], outputs: [] }) as StepOfType<T>
            default: return assertExhaustive(type, `Could not create step of type ${JSON.stringify(type)}`)
        }
    } finally {
        projectStore.setValue(() => project)
    }
}
