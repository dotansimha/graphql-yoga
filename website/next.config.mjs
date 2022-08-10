import { withGuildDocs } from 'guild-docs/next.config'

export default withGuildDocs({
  eslint: {
    ignoreDuringBuilds: true,
  },
  redirects: () => [
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
  ],
})
