import { immCreateSound } from "../../store/project"
import { EntityWorkspace } from "./EntityWorkspace"
import styles from './SoundWorkspace.module.css'

export const SoundWorkspace = () => {
    return <EntityWorkspace type='sound' immCreate={immCreateSound}>{sound => <>
    
    </>}</EntityWorkspace>
}
