import esbuild from 'esbuild'
//import htmlPlugin from '@chialab/esbuild-plugin-html'
import { htmlPlugin } from '@craftamap/esbuild-plugin-html'

export const buildContext = await esbuild.context({
    bundle: true,
    entryPoints: ['src/main.css', 'src/index.tsx'],
    outdir: './resources',
    assetNames: '[name]-[hash]',
    chunkNames: '[name]-[hash]',
    sourcemap: 'inline',
    sourcesContent: true,
    format: 'esm',
    publicPath: '.',
    metafile: true,
    loader: {
        '.png': 'file',
        '.svg': 'file',
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
