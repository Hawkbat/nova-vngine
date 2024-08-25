import { immCreateBackdrop } from "../../store/project"
import { EntityWorkspace } from "./EntityWorkspace"
import styles from './BackdropWorkspace.module.css'

export const BackdropWorkspace = () => {
    return <EntityWorkspace type='backdrop' immCreate={immCreateBackdrop}>{backdrop => <>
    
    </>}</EntityWorkspace>
}
