import type { ProjectDefinition, ProjectID } from "../types/definitions"
import { randID, randSeedRandom } from "../utils/rand"
import { createTrackedStore } from "../utils/store"

export const projectStore = createTrackedStore(createProject())

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
