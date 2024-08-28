
declare const COMMIT_SHORT_HASH: string
declare const COMMIT_BRANCH: string

export const BUILD_COMMIT = {
    SHORT_HASH: COMMIT_SHORT_HASH,
    BRANCH: COMMIT_BRANCH,
}

declare const BUILD_TIMESTAMP: number
export const BUILD_DATETIME = new Date(BUILD_TIMESTAMP)
