import { publish } from 'gh-pages'
import * as fs from 'fs'

console.log('Staging build...')

fs.rmSync('dist', { recursive: true, force: true })
fs.mkdirSync('dist', { recursive: true })
fs.cpSync('resources', 'dist', { recursive: true })
fs.cpSync('example-project', 'dist/project', { recursive: true })

console.log('Publishing...')

publish('dist', {
    nojekyll: true,
    cname: 'vngine.hawk.bar',
    message: `Published ${new Date().toLocaleString()}`,
}, err => {
    if (err) console.error(err)
    else console.log('Published!')
})
