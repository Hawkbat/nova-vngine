import { projectStore } from '../../store/project'
import type { ChapterDefinition, SceneID } from '../../types/project'
import { immSet } from '../../utils/imm'
import { useSelector } from '../../utils/store'
import { EntityField } from '../common/EntityField'
import { EntityWorkspace } from './EntityWorkspace'

import styles from './ChapterWorkspace.module.css'

const ChapterEditor = ({ chapter, setChapter }: { chapter: ChapterDefinition, setChapter: (setter: (chapter: ChapterDefinition) => ChapterDefinition) => void }) => {
    const scenes = useSelector(projectStore, s => s.scenes)().filter(c => c.chapterID === chapter.id)
    return <>
        <EntityField label='First Scene' type='scene' value={chapter.firstSceneID ?? '' as SceneID} setValue={sceneID => setChapter(s => immSet(s, 'firstSceneID', sceneID ? sceneID : null))} options={scenes} />
    </>
}

export const ChapterWorkspace = () => {
    return <EntityWorkspace type='chapter' getVariableScopes={chapter => [{ type: 'chapter', value: chapter.id }, { type: 'chapters', value: [chapter.id] }, { type: 'allChapters' }]}>{(chapter, setChapter) => <ChapterEditor key={chapter.id} chapter={chapter} setChapter={setChapter} />}</EntityWorkspace>
}
