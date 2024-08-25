
export function isUpperCase(c: string) {
    return c.charCodeAt(0) >= 0x41 && c.charCodeAt(0) <= 0x5A
}

export function isLowerCase(c: string) {
    return c.charCodeAt(0) >= 0x61 && c.charCodeAt(0) <= 0x7A
}

export function prettyPrintIdentifier(s: string) {
    if (!s) return s
    let o = ''
    let i = 0
    let isWordBoundary = true
    while (i < s.length) {
        if (isWordBoundary && isLowerCase(s[i])) {
            o += s[i++].toUpperCase()
            isWordBoundary = false
        } else if (s[i] === '_') {
            o += ' '
            i++
            isWordBoundary = true
        } else if (i < s.length - 1 && isLowerCase(s[i]) && isUpperCase(s[i + 1])) {
            o += s[i++]
            o += ' '
            isWordBoundary = true
        } else {
            o += s[i++]
        }
    }
    return o
}

export function camelCaseString(s: string) {
    if (!s) return s
    let o = ''
    let i = 0
    while (i < s.length) {
        if (i === 0 && isUpperCase(s[i])) {
            while (i < s.length && isUpperCase(s[i])) {
                o += s[i++].toLowerCase()
            }
        } else if (s[i] === ' ') {
            i++
            o += s[i++].toUpperCase()
        } else {
            o += s[i++]
        }
    }
    return o
}

type ClassLike = boolean | null | undefined | string | string[] | Record<string, unknown>

export function classes(...classes: ClassLike[]) {
    return classes.flatMap(c => {
        if (typeof c === 'string') return [c]
        if (Array.isArray(c)) return c
        if (typeof c !== 'object' || c === null) return []
        return Object.entries(c).flatMap(([k, v]) => v ? [k] : [])
    }).filter(c => !!c).join(' ')
}
