import { immCreateVariable } from "../../store/project"
import { AnyVariableDefinition } from "../../types/definitions"
import { EntityWorkspace } from "./EntityWorkspace"
import styles from './VariableWorkspace.module.css'

const VariableEditor = ({ variable }: { variable: AnyVariableDefinition }) => {
    return <></>
}

export const VariableWorkspace = () => {
    return <EntityWorkspace type='variable' immCreate={immCreateVariable}>{variable => <VariableEditor variable={variable as AnyVariableDefinition} />}</EntityWorkspace>
}
