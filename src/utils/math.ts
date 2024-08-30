
export function lerp(t: number, min: number, max: number) {
    return min + (max - min) * t
}

export function inverseLerp(v: number, min: number, max: number) {
    return (v - min) / (max - min)
}

export function remap(v: number, minFrom: number, maxFrom: number, minTo: number, maxTo: number) {
    return lerp(inverseLerp(v, minFrom, maxFrom), minTo, maxTo)
}

export function moveTowards(v: number, to: number, amount: number) {
    const diff = to - v
    const delta = Math.sign(diff) * Math.min(amount, Math.abs(diff))
    return v + delta
}
