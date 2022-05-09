import { createRequire } from 'node:module'
import nextBundleAnalyzer from '@next/bundle-analyzer'
import { withGuildDocs } from '@guild-docs/server'
import { register } from 'esbuild-register/dist/node.js'
import { i18n } from './next-i18next.config.js'

register({ extensions: ['.ts', '.tsx'] })

const require = createRequire(import.meta.url)

const { getRoutes, getTutorialRoutes } = require('./routes.ts')

const withBundleAnalyzer = nextBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})
export default withBundleAnalyzer(
  withGuildDocs({
    env: {
      // This is a pre-serialized version of the tutorial routes that prevents calculating the routes on production
      SERIALIZED_TUTORIAL_MDX_ROUTES: JSON.stringify(getTutorialRoutes()),
    },
    i18n,
    getRoutes,
    redirects: () => {
      return [
        {
          source: '/docs',
          destination: '/docs/quick-start',
          permanent: true,
        },
        {
          source: '/tutorial',
          destination: '/tutorial/basic/00-introduction',
          permanent: true,
        },
        {
          source: '/docs/testing',
          destination: '/docs/features/testing',
          permanent: true,
        },
      ]
    },
  }),
)
