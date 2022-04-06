import { XMLParser } from 'fast-xml-parser'
import * as fs from 'fs'
import type { Redirect } from 'next/dist/lib/load-custom-routes'
import * as path from 'path'
import config from '../next.config.js'

const sitemapPath = path.join(__dirname, '..', 'public', 'sitemap-0.xml')
const lockfilePath = path.join(__dirname, '..', 'route-lockfile.txt')

async function main() {
  const parser = new XMLParser()

  const d = parser.parse(fs.readFileSync(sitemapPath, 'utf-8'))

  const routes: Array<string> = d.urlset.url.map((url: any) =>
    url.loc.replace(`https://graphql-yoga.com`, ``),
  )

  const redirectsPointingToNonExistingStuff: Array<Redirect> = []

  const redirects: Redirect[] = config.redirects()

  for (const redirect of redirects) {
    if (routes.includes(redirect.destination) === false) {
      redirectsPointingToNonExistingStuff.push(redirect)
    }
    routes.push(`${redirect.source} -> ${redirect.destination}`)
  }

  fs.writeFileSync(lockfilePath, routes.join(`\n`) + `\n`)
}

main()
