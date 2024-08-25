import { immCreateStory } from "../../store/project"
import { EntityWorkspace } from "./EntityWorkspace"
import styles from './StoryWorkspace.module.css'

export const StoryWorkspace = () => {
    return <EntityWorkspace type='story' immCreate={immCreateStory}>{story => <>
        
    </>}</EntityWorkspace>
}
