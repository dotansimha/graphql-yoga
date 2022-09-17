import { withGuildDocs } from '@theguild/components/next.config'
import { applyUnderscoreRedirects } from '@theguild/components/underscore-redirects'

export default withGuildDocs({
  basePath: process.env.NEXT_BASE_PATH || undefined,
  images: {
    unoptimized: true, // doesn't work with `next export`
  },
  webpack(config, meta) {
    applyUnderscoreRedirects(config, meta)
    return config
  },
  redirects: () =>
    Object.entries({
      '/docs/quick-start': '/docs',
      '/tutorial': '/tutorial/basic',
      '/tutorial/basic/00-introduction': '/tutorial/basic',
      '/docs/testing': '/docs/features/testing',
      '/docs/integrations': '/docs',
      '/docs/features': '/docs',
      '/examples/graphql-ws': '/docs/features/subscriptions',
    }).map(([from, to]) => ({
      source: from,
      destination: to,
      permanent: true,
    })),
})
