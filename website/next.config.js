require('bob-tsm')

const { i18n } = require('./next-i18next.config.js')

const { withGuildDocs } = require('@guild-docs/server')

const { getRoutes, getTutorialRoutes } = require('./routes.ts')

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(
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
          destination: '/tutorial/00-introduction',
          permanent: true,
        },
      ]
    },
  }),
)
