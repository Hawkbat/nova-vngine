import { EntityWorkspace } from './EntityWorkspace'

import styles from './StoryWorkspace.module.css'

export const StoryWorkspace = () => {
    return <EntityWorkspace type='story' getVariableScopes={story => [{ type: 'story', value: story.id }, { type: 'stories', value: [story.id] }, { type: 'allStories' }]}>{story => <>

    </>}</EntityWorkspace>
}
