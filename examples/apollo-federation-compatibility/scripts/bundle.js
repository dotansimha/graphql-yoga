/* eslint-disable */
const { build } = require('esbuild');
const { copyFileSync } = require('fs');
const { join } = require('path');

async function main() {
  await build({
    entryPoints: ['./src/index.ts'],
    outfile: 'dist/index.js',
    format: 'cjs',
    minify: false,
    bundle: true,
    platform: 'node',
    target: 'es2020',
  });

  console.info(`Apollo Subgraph test build done!`);

  copyFileSync(join(__dirname, '../schema.graphql'), join(__dirname, '../dist/schema.graphql'));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
