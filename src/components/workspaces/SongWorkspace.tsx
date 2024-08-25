import { immCreateSong } from "../../store/project"
import { EntityWorkspace } from "./EntityWorkspace"
import styles from './SongWorkspace.module.css'

export const SongWorkspace = () => {
    return <EntityWorkspace type='song' immCreate={immCreateSong}>{song => <>

    </>}</EntityWorkspace>
}
