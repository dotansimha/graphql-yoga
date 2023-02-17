import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const directoryName = path.dirname(fileURLToPath(import.meta.url))
const inputPath = path.resolve(directoryName, '..', '..', 'graphiql', 'dist')
const jsFile = path.resolve(inputPath, 'yoga-graphiql.umd.js')
const cssFile = path.resolve(inputPath, 'style.css')
const faviconFile = path.resolve(directoryName, '../../../website/public/favicon.ico')

const outFile = path.resolve(directoryName, '..', 'src', 'graphiql.ts')

const jsContents = fs.readFileSync(jsFile, 'utf-8')
const cssContents = fs.readFileSync(cssFile, 'utf-8')
const faviconContents = `data:image/x-icon;base64,${fs.readFileSync(
  faviconFile,
  'base64',
)}`

fs.writeFileSync(
  outFile,
  [
    `export const js: string = ${JSON.stringify(jsContents)}`,
    `export const css: string = ${JSON.stringify(cssContents)}`,
    `export const favicon: string = ${JSON.stringify(faviconContents)}`,
  ].join('\n'),
)
