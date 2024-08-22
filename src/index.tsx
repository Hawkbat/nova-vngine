import { init, events, app } from '@neutralinojs/lib'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './components/App'

init()

const appContainer = document.createElement('div')
appContainer.id = 'appContainer'
document.body.append(appContainer)

const appRoot = createRoot(appContainer)
appRoot.render(<StrictMode><App /></StrictMode>)

events.on('windowClose', async (ev: CustomEvent<null>) => {
    await app.exit()
})
