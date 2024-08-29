import { immCreatePortrait } from '../../store/operations'
import { EntityWorkspace } from './EntityWorkspace'
import styles from './PortraitWorkspace.module.css'

export const PortraitWorkspace = () => {
    return <EntityWorkspace type='portrait' immCreate={immCreatePortrait}>{character => <>

    </>}</EntityWorkspace>
}
