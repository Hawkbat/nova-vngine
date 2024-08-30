import type { ProjectDefinition, ProjectID } from '../types/project'
import { randSeedRandom } from '../utils/rand'
import { createTrackedStore } from '../utils/store'

export const projectStore = createTrackedStore(createDefaultProject(''))

export function createDefaultProject(id: string): ProjectDefinition {
    const project: ProjectDefinition = {
        id: id as ProjectID,
        name: '',
        editorRandState: randSeedRandom(),
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
