import { createRequire } from 'node:module'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { indexToAlgolia } from '@guild-docs/algolia'
import { register } from 'esbuild-register/dist/node.js'

register({ extensions: ['.ts', '.tsx'] })

const require = createRequire(import.meta.url)
const __dirname = dirname(fileURLToPath(import.meta.url))

const { getRoutes, getTutorialRoutes } = require('../routes.ts')

indexToAlgolia({
  routes: [getRoutes(), getTutorialRoutes()],
  source: 'Yoga',
  domain: process.env.SITE_URL,
  lockfilePath: resolve(__dirname, '../algolia-lockfile.json'),
  dryMode: process.env.ALGOLIA_DRY_RUN === 'true',
})
