import { Branded } from "../utils/types"
import { StringExpr, CharacterExpr, BackdropExpr, LocationExpr, SongExpr, SoundExpr, BooleanExpr, VariableExpr, ValueExpr } from "./expressions"

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
    music: {
        song: SongExpr
    }
    stopMusic: {

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
        branches: {
            condition: BooleanExpr
            steps: AnyStep[]
        }[]
    }
    set: {
        variable: VariableExpr
        value: ValueExpr
    }
}

export type StepType = keyof StepMap
export type StepOfType<T extends StepType> = T extends StepType ? { id: StepID, type: T } & StepMap[T] : never
export type AnyStep = StepOfType<StepType>
