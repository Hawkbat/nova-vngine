import { userPlayStory } from '../../operations/player'
import { projectStore } from '../../store/project'
import type { ChapterID, StoryDefinition } from '../../types/project'
import { immSet } from '../../utils/imm'
import { useSelector } from '../../utils/store'
import { EditorButton, EditorButtonGroup } from '../common/EditorButton'
import { EntityField } from '../common/EntityField'
import { EntityWorkspace } from './EntityWorkspace'

import styles from './StoryWorkspace.module.css'

const StoryEditor = ({ story, setStory }: { story: StoryDefinition, setStory: (setter: (story: StoryDefinition) => StoryDefinition) => void }) => {
    const chapters = useSelector(projectStore, s => s.chapters)().filter(c => c.storyID === story.id)
    return <>
        <EntityField label='First Chapter' type='chapter' value={story.firstChapterID ?? '' as ChapterID} setValue={chapterID => setStory(s => immSet(s, 'firstChapterID', chapterID ? chapterID : null))} options={chapters} />
        <EditorButtonGroup side='left'>
            <EditorButton onClick={() => userPlayStory(story.id)}>Play Story</EditorButton>
        </EditorButtonGroup>
    </>
}

export const StoryWorkspace = () => {
    return <EntityWorkspace type='story' getVariableScopes={story => [{ type: 'story', value: story.id }, { type: 'stories', value: [story.id] }, { type: 'allStories' }]}>{(story, setStory) => <StoryEditor key={story.id} story={story} setStory={setStory} />}</EntityWorkspace>
}
