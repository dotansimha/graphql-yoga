import { indexToAlgolia } from '@guild-docs/algolia'
import { join } from 'node:path'

import { getRoutes, getTutorialRoutes } from '../routes'

indexToAlgolia({
  routes: [getRoutes(), getTutorialRoutes()],
  source: 'Yoga',
  dryMode: !!process.env.ALGOLIA_DRY_RUN,
  lockfilePath: join(__dirname, '..', 'algolia-lockfile.txt'),
})
