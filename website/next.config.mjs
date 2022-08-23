import { withGuildDocs } from 'guild-docs/next.config'

export default withGuildDocs({
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
