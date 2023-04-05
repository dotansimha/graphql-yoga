/* eslint-disable */
const { build } = require('esbuild')

async function main() {
  await build({
    entryPoints: ['./pages/api/graphql.ts'],
    outfile: 'dist/index.js',
    format: 'esm',
    minify: false,
    bundle: true,
    platform: 'browser',
    target: 'es2020',
  })

  console.info(`Vercel Function build done!`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
