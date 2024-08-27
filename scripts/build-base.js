import esbuild from 'esbuild'
import { htmlPlugin } from '@craftamap/esbuild-plugin-html'

const DEVELOPMENT = true

export const buildContext = await esbuild.context({
    bundle: true,
    entryPoints: ['src/main.css', 'src/index.tsx'],
    outdir: './resources',
    assetNames: '[name]-[hash]',
    chunkNames: '[name]-[hash]',
    sourcemap: DEVELOPMENT ? 'inline' : undefined,
    minify: !DEVELOPMENT,
    sourcesContent: DEVELOPMENT,
    format: 'esm',
    publicPath: '.',
    metafile: true,
    loader: {
        '.png': 'file',
        '.svg': 'file',
        '.ttf': 'file',
    },
    plugins: [
        htmlPlugin({ files: [
            {
                entryPoints: [
                    'src/main.css',
                    'src/index.tsx'
                ],
                filename: 'index.html',
                scriptLoading: 'module',
                title: 'Nova VNgine',
                favicon: 'src/favicon.ico',
                extraScripts: ['/__neutralino_globals.js'],
                hash: true,
                inline: filepath => filepath.endsWith('/main.css'),
            }
        ] }),
    ],
})
