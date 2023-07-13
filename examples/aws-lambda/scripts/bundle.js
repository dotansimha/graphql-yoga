/* eslint-disable */
const { build } = require('esbuild');

async function main() {
  await build({
    entryPoints: ['./lambda/graphql.ts'],
    outfile: 'dist/index.js',
    format: 'cjs',
    minify: false,
    bundle: true,
    platform: 'node',
    target: 'es2020',
  });

  console.info(`AWS Lambda build done!`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
