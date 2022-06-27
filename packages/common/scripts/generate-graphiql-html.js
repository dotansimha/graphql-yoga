import { minify } from 'html-minifier-terser'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function main() {
  const graphiqlVersion = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '..', '..', 'graphiql', 'package.json'),
      'utf-8',
    ),
  ).version

  const minified = (
    await minify(
      fs
        .readFileSync(
          path.join(__dirname, '..', 'src', 'graphiql.html'),
          'utf-8',
        )
        .replace(/__GRAPHIQL_VERSION__/g, graphiqlVersion),
      {
        minifyJS: true,
        useShortDoctype: false,
        removeAttributeQuotes: true,
        collapseWhitespace: true,
      },
    )
  ).toString('utf-8')

  fs.writeFileSync(
    path.join(__dirname, '../src/graphiqlHTML.ts'),
    `export default ${JSON.stringify(minified)}`,
  )
}

main()
