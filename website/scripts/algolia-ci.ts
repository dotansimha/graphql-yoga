import { indexToAlgolia } from '@guild-docs/algolia'
import { join } from 'node:path'

import { getRoutes, getTutorialRoutes } from '../routes'

indexToAlgolia({
  routes: [getRoutes(), getTutorialRoutes()],
  source: 'Yoga',
  domain: process.env.SITE_URL!,
  lockfilePath: join(__dirname, '..', 'algolia-lockfile.txt'),
  dryMode: process.env.ALGOLIA_DRY_RUN === 'true',
})
