import { immCreateChapter } from '../../store/operations'
import { EntityWorkspace } from './EntityWorkspace'
import styles from './ChapterWorkspace.module.css'

export const ChapterWorkspace = () => {
    return <EntityWorkspace type='chapter' immCreate={immCreateChapter}>{chapter => <>

    </>}</EntityWorkspace>
}
