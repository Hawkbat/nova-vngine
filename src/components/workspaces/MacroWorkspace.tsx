import { EntityWorkspace } from './EntityWorkspace'

import styles from './MacroWorkspace.module.css'

export const MacroWorkspace = () => {
    return <EntityWorkspace type='macro' getVariableScopes={macro => [{ type: 'macro', value: macro.id }, { type: 'macros', value: [macro.id] }, { type: 'allMacros' }]}>{macro => <>

    </>}</EntityWorkspace>
}
