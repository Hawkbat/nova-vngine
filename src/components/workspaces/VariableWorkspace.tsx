import { immCreateVariable } from '../../store/operations'
import type { AnyVariableDefinition } from '../../types/project'
import { EntityWorkspace } from './EntityWorkspace'
import styles from './VariableWorkspace.module.css'

const VariableEditor = ({ variable }: { variable: AnyVariableDefinition }) => {
    return <></>
}

export const VariableWorkspace = () => {
    return <EntityWorkspace type='variable' immCreate={immCreateVariable}>{variable => <VariableEditor variable={variable} />}</EntityWorkspace>
}
