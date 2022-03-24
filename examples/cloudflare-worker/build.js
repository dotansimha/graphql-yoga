const { build } = require('esbuild')

;(async function main() {
  await build({
    entryPoints: ['./src/index.ts'],
    bundle: true,
    platform: 'browser',
    target: 'chrome95',
    minify: true,
    outfile: 'dist/index.js',
    treeShaking: true,
  })

  console.info(`Done`)
})()
