import { arrayHead, arrayTail } from './array'
import { throwIfNull } from './guard'
import { immKeepWhile } from './imm'

const domainRegex = /^(?:[a-zA-Z][a-zA-Z0-9+.-]*:(?:\/\/(?:\w*(?::\w*)?@)?(?:[\w.-]+|\[[0-9a-fA-F.]+\])(?::\d+)?)?|\\\\\w+)/

function pathHasDomain(path: string) {
    return domainRegex.test(path)
}

export function pathIsAbsolute(path: string) {
    if (pathHasDomain(path)) return true
    return normalizePath(path).startsWith('/')
}

export function getPathFileName(path: string): string {
    const segments = getPathSegments(normalizePath(path))
    if (!segments.length) return ''
    return throwIfNull(arrayTail(segments))
}

export function getPathParentPath(path: string): string {
    const segments = getPathSegments(normalizePath(path))
    if (segments.length < 2) return ''
    return joinPathSegments(segments.slice(0, -1))
}

export function getPathExtension(path: string): string {
    const fileName = getPathFileName(path)
    const index = fileName.indexOf('.')
    if (index >= 0) return fileName.substring(index)
    return ''
}

export function getPathHierarchy(path: string): string[] {
    const results: string[] = []
    const segments = getPathSegments(normalizePath(path))
    while (segments.length) {
        results.unshift(joinPathSegments(segments))
        segments.pop()
    }
    return results
}

export function normalizePath(path: string): string {
    const domainMatch = path.match(domainRegex)
    if (domainMatch) {
        const domain = domainMatch[0]
        const subPath = normalizePath(path.substring(domain.length))
        return `${domain}${subPath}`
    }
    const queryIndex = path.indexOf('?')
    const fragmentIndex = path.indexOf('#')
    if (queryIndex >= 0 || fragmentIndex >= 0) {
        const tailIndex = queryIndex >= 0 && fragmentIndex >= 0 ? Math.min(queryIndex, fragmentIndex) : queryIndex >= 0 ? queryIndex : fragmentIndex
        const tail = path.substring(tailIndex)
        const subPath = normalizePath(path.substring(0, tailIndex))
        return `${subPath}${tail}`
    }
    path = path.replaceAll('\\', '/')
    if (path.startsWith('./')) path = path.substring(2)
    if (path.endsWith('/')) path = path.substring(0, path.length - 1)
    const pathSegments = getPathSegments(path)
    const resultSegments: string[] = []
    while (pathSegments.length) {
        const segment = pathSegments.shift()
        if (segment === undefined) break
        else if (segment === '.') continue
        else if (segment === '..' && resultSegments.length) resultSegments.pop()
        else resultSegments.push(segment)
    }
    return joinPathSegments(resultSegments)
}

export function getPathSegments(path: string): string[] {
    const domainMatch = path.match(domainRegex)
    if (domainMatch) {
        const domain = domainMatch[0]
        const subPath = path.substring(domain.length)
        const segments = getPathSegments(subPath)
        return [`${domain}${arrayHead(segments) ?? ''}`, ...segments.slice(1)]
    }
    const queryIndex = path.indexOf('?')
    const fragmentIndex = path.indexOf('#')
    if (queryIndex >= 0 || fragmentIndex >= 0) {
        const tailIndex = queryIndex >= 0 && fragmentIndex >= 0 ? Math.min(queryIndex, fragmentIndex) : queryIndex >= 0 ? queryIndex : fragmentIndex
        const tail = path.substring(tailIndex)
        const subPath = path.substring(0, tailIndex)
        const segments = getPathSegments(subPath)
        return [...segments.slice(0, -1), `${arrayTail(segments) ?? ''}${tail}`]
    }
    return path.split('/')
}

export function joinPathSegments(segments: string[]): string {
    return segments.join('/')
}

export function joinPaths(...paths: string[]): string {
    return normalizePath(paths.reduce((p, c) => pathIsAbsolute(c) ? normalizePath(c) : `${p}/${normalizePath(c)}`))
}

export function getAbsolutePath(to: string, from: string) {
    if (pathIsAbsolute(to)) return normalizePath(to)
    return normalizePath(`${from}/${to}`)
}

export function getRelativePath(to: string, from: string) {
    if (!pathIsAbsolute(to)) return normalizePath(to)

    const toSegments = getPathSegments(normalizePath(to))
    const fromSegments = getPathSegments(normalizePath(from))
    const sharedSegments = immKeepWhile(fromSegments, (s, i) => toSegments[i] === s)

    const resultSegments: string[] = []
    for (const _ of fromSegments.slice(sharedSegments.length)) {
        resultSegments.push('..')
    }
    for (const s of toSegments.slice(sharedSegments.length)) {
        resultSegments.push(s)
    }
    return joinPathSegments(resultSegments)
}
