import { buildContext } from "./build-base.js"

await buildContext.watch()
const { port } = await buildContext.serve({ servedir: 'resources' })
console.log(`Serving on http://localhost:${port}/`)
