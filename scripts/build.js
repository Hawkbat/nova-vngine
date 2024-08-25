import { buildContext } from "./build-base.js"
import { rm } from 'fs/promises'

const KB = 1024
const MB = KB * 1024
const GB = MB * 1024

function formatBytes(b) {
    if (b > GB) {
        return `${Math.round(b / GB * 100) / 100} GB`
    } else if (b > MB) {
        return `${Math.round(b / MB * 100) / 100} MB`
    } else if (b > KB) {
        return `${Math.round(b / KB * 100) / 100} KB`
    } else {
        return `${b} B`
    }
}

await rm('./resources', { recursive: true, force: true })
const result = await buildContext.rebuild()
for (const warning of result.warnings) console.log(warning)
for (const error of result.errors) console.log(error)
for (const [filename, data] of Object.entries(result.metafile.outputs)) console.log('Built', filename, `(${formatBytes(data.bytes)})`)
await buildContext.dispose()
