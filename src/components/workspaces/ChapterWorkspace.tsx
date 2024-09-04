import { EntityWorkspace } from './EntityWorkspace'

import styles from './ChapterWorkspace.module.css'

export const ChapterWorkspace = () => {
    return <EntityWorkspace type='chapter' getVariableScopes={chapter => [{ type: 'chapter', value: chapter.id }, { type: 'chapters', value: [chapter.id] }, { type: 'allChapters' }]}>{chapter => <>

    </>}</EntityWorkspace>
}
