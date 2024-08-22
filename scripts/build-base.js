import esbuild from 'esbuild'
import htmlPlugin from '@chialab/esbuild-plugin-html'

export const buildContext = await esbuild.context({
    bundle: true,
    entryPoints: ['src/index.template.html'],
    entryNames: 'index',
    outdir: './resources',
    assetNames: 'bundle/[name]-[hash]',
    chunkNames: 'bundle/[name]-[hash]',
    sourcemap: 'inline',
    sourcesContent: true,
    format: 'esm',
    publicPath: '.',
    metafile: true,
    plugins: [
        htmlPlugin(),
    ],
})
