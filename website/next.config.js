import { withGuildDocs } from '@theguild/components/next.config';

// eslint-disable-next-line import/no-default-export
export default withGuildDocs({
  nextraConfig: {
    transformPageMap(pageOpts) {
      // TODO: temporal fix to show link for versioned folder in navbar (otherwise you can see only when navigated to it directly)
      pageOpts
        .find(o => o.name === 'v2')
        .children.push({
          name: 'index',
          route: '/v2',
          frontMatter: {},
        });
      pageOpts
        .find(o => o.name === 'v3')
        .children.push({
          name: 'index',
          route: '/v3',
          frontMatter: {},
        });
      pageOpts
        .find(o => o.name === 'v4')
        .children.push({
          name: 'index',
          route: '/v4',
          frontMatter: {},
        });
      return pageOpts;
    },
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
  eslint: {
    ignoreDuringBuilds: true,
  },
});
