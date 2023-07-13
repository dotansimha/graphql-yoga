/* eslint-disable */
const { build } = require('esbuild');
const { copyFileSync } = require('fs');
const { join } = require('path');

async function main() {
  await build({
    entryPoints: ['./dist/main.js'],
    outfile: 'dist/index.js',
    format: 'cjs',
    minify: false,
    bundle: true,
    platform: 'node',
    target: 'es2020',
    loader: { '.node': 'file' },
  });

  console.info(`NestJS Apollo Subgraph test build done!`);

  copyFileSync(join(__dirname, '../schema.graphql'), join(__dirname, '../dist/schema.graphql'));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
