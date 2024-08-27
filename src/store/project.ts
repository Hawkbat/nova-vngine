import type { EntityOfType, EntityType, ProjectDefinition, ProjectID } from "../types/definitions"
import { randID, randSeedRandom } from "../utils/rand"
import { createTrackedStore } from "../utils/store"

export const projectStore = createTrackedStore(createProject())

export type EntityPair<T extends EntityType> = { type: T, entity: EntityOfType<T> }

export function createProject(): ProjectDefinition {
    const [editorRandState, id] = randID(randSeedRandom())

    const project: ProjectDefinition = {
        id: id as ProjectID,
        name: '',
        editorRandState,
        stories: [],
        chapters: [],
        scenes: [],
        characters: [],
        portraits: [],
        backdrops: [],
        songs: [],
        sounds: [],
        variables: [],
        macros: [],
    }

    return project
}
