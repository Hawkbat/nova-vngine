import { immCreateStory, projectStore } from "../../store/project"
import { viewStateStore } from "../../store/viewstate"
import { immReplaceBy, immSet } from "../../utils/imm"
import { useSelector } from "../../utils/store"
import { EditorIcon } from "../common/EditorIcon"
import { COMMON_ICONS, EXPR_VALUE_ICONS } from "../common/Icons"
import { StringField } from "../common/StringField"
import styles from './StoryWorkspace.module.css'

export const StoryWorkspace = ({ }: { }) => {
    const [storyID, setViewState] = useSelector(viewStateStore, s => s.scopes.story ?? null)
    const [stories, setProject] = useSelector(projectStore, s => s.stories)

    const story = storyID ? stories.find(s => s.id === storyID) : null

    const onNewStory = () => {
        const [project, story] = immCreateStory(projectStore.getSnapshot())
        setProject(() => project)
        setViewState(s => immSet(s, 'scopes', immSet(s.scopes, 'story', story.id)))
    }

    return <div className={styles.workspace}>
        {story ? <>
            <StringField label='Story Name' value={story.name} setValue={name => setProject(project =>  immSet(project, 'stories', immReplaceBy(project.stories, s => s.id, immSet(story, 'name', name))))} validate={s => s ? '' : 'Name must be filled out'} />
            <StringField label='Story ID' value={story.id} />
        </> : <>
            <div className={styles.storyList}>
                {stories.map(story => <EditorIcon key={story.id} path={EXPR_VALUE_ICONS.story} label={story.name ? story.name : 'Untitled Story'} active={false} showLabel onClick={() => setViewState(s => immSet(s, 'scopes', immSet(s.scopes, 'story', story.id)))} />)}
                    <EditorIcon path={COMMON_ICONS.addItem} label="New Story" showLabel onClick={onNewStory} />
            </div>
        </>}
    </div>
}
