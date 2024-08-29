import { buildContext } from './build-base.js'

const { port } = await buildContext.serve({ servedir: 'resources' })
console.log(`Serving on http://localhost:${port}/`)
