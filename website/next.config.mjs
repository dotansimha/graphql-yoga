import { withGuildDocs } from 'guild-docs/next.config'
import { applyUnderscoreRedirects } from 'guild-docs/underscore-redirects'

export default withGuildDocs({
  basePath:
    process.env.NEXT_BASE_PATH && process.env.NEXT_BASE_PATH !== ''
      ? process.env.NEXT_BASE_PATH
      : undefined,
  experimental: {
    images: {
      unoptimized: true, // doesn't work with `next export`
      allowFutureImage: true,
    },
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
    }).map(([from, to]) => ({
      source: from,
      destination: to,
      permanent: true,
    })),
})
