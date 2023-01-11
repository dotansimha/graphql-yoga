/* eslint-disable */
const { build } = require('esbuild')

async function main() {
  await build({
    entryPoints: ['./src/index.ts'],
    outfile: 'netlify/edge-functions/graphql.js',
    format: 'esm',
    minify: false,
    bundle: true,
    platform: 'browser',
    target: 'node14',
  })

  console.info(`Netlify Edge function build done!`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
