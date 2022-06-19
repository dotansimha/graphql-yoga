const { minify } = require('html-minifier-terser')
const { readFileSync, writeFileSync } = require('fs')
const { join } = require('path')
const fs = require('fs')

async function main() {
  const graphiqlVersion = JSON.parse(
    fs.readFileSync(
      join(__dirname, '..', '..', 'graphiql', 'package.json'),
      'utf-8',
    ),
  ).version

  const minified = (
    await minify(
      readFileSync(
        join(__dirname, '..', 'src', 'graphiql.html'),
        'utf-8',
      ).replace(/__GRAPHIQL_VERSION__/g, graphiqlVersion),
      {
        minifyJS: true,
        useShortDoctype: false,
        removeAttributeQuotes: true,
        collapseWhitespace: true,
      },
    )
  ).toString('utf-8')

  writeFileSync(
    join(__dirname, '../src/graphiqlHTML.ts'),
    `export default ${JSON.stringify(minified)}`,
  )
}

main()
