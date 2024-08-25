import { immCreateChapter, projectStore } from "../../store/project"
import { viewStateStore } from "../../store/viewstate"
import { immReplaceBy, immSet } from "../../utils/imm"
import { useSelector } from "../../utils/store"
import { EditorIcon } from "../common/EditorIcon"
import { COMMON_ICONS, EXPR_VALUE_ICONS } from "../common/Icons"
import { StringField } from "../common/StringField"
import styles from './ChapterWorkspace.module.css'

export const ChapterWorkspace = ({ }: { }) => {
    const [chapterID, setViewState] = useSelector(viewStateStore, s => s.scopes.chapter ?? null)
    const [storyID] = useSelector(viewStateStore, s => s.scopes.story)
    const [chapters, setProject] = useSelector(projectStore, s => s.chapters)

    const chapter = chapterID ? chapters.find(s => s.id === chapterID) : null

    const onNewChapter = () => {
        if (!storyID) return
        const [project, chapter] = immCreateChapter(projectStore.getSnapshot(), storyID)
        setProject(() => project)
        setViewState(s => immSet(s, 'scopes', immSet(s.scopes, 'chapter', chapter.id)))
    }

    return <div className={styles.workspace}>
        {chapter ? <>
            <StringField label='Chapter Name' value={chapter.name} setValue={name => setProject(project =>  immSet(project, 'chapters', immReplaceBy(project.chapters, s => s.id, immSet(chapter, 'name', name))))} validate={s => s ? '' : 'Name must be filled out'} />
            <StringField label='Chapter ID' value={chapter.id} />
        </> : <>
            <div className={styles.chapterList}>
                {chapters.map(chapter => <EditorIcon key={chapter.id} path={EXPR_VALUE_ICONS.chapter} label={chapter.name ? chapter.name : 'Untitled Chapter'} active={false} showLabel onClick={() => setViewState(s => immSet(s, 'scopes', immSet(s.scopes, 'chapter', chapter.id)))} />)}
                    <EditorIcon path={COMMON_ICONS.addItem} label="New Chapter" showLabel onClick={onNewChapter} />
            </div>
        </>}
    </div>
}
