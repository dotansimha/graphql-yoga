import { resolve } from 'node:path'
import { indexToAlgolia } from '@guild-docs/algolia'

const CWD = process.cwd()

indexToAlgolia({
  nextra: {
    docsBaseDir: resolve(CWD, 'src/pages/'),
  },
  // routes: [getRoutes(), getTutorialRoutes()],
  source: 'Yoga',
  domain: process.env.SITE_URL,
  lockfilePath: resolve(CWD, 'algolia-lockfile.json'),
  dryMode: process.env.ALGOLIA_DRY_RUN === 'true',
})
