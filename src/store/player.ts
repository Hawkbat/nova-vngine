import type { GamePlayerState } from '../types/player'
import { createTrackedStore } from '../utils/store'

export const gamePlayerStore = createTrackedStore<GamePlayerState>({
    currentSave: null,
})
