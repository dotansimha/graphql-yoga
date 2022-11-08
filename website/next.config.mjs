import { withGuildDocs } from '@theguild/components/next.config'

export default withGuildDocs({
  redirects: () =>
    Object.entries({
      '/docs/quick-start': '/docs',
      '/tutorial': '/tutorial/basic',
      '/tutorial/basic/00-introduction': '/tutorial/basic',
      '/docs/testing': '/docs/features/testing',
      '/docs/integrations': '/docs',
      '/docs/features': '/docs',
      '/examples/graphql-ws': '/docs/features/subscriptions',
      '/v3/features/incremental-delivery': '/v3/features/defer-stream',
    }).map(([from, to]) => ({
      source: from,
      destination: to,
      permanent: true,
    })),
})
