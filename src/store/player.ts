import type { GamePlayerState } from '../types/player'
import type { StoryID } from '../types/project'
import { randSeedRandom } from '../utils/rand'
import { createTrackedStore } from '../utils/store'

export const gamePlayerStore = createTrackedStore<GamePlayerState>({
    randState: randSeedRandom(),
    storyID: '' as StoryID,
    actions: [],
    stopAfter: null,
})
