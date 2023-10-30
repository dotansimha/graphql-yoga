import { withGuildDocs } from '@theguild/components/next.config';

export default withGuildDocs({
  output: 'export',
  transformPageOpts(pageOpts) {
    // TODO: temporal fix to show link for versioned folder in navbar (otherwise you can see only when navigated to it directly)
    pageOpts.pageMap
      .find(o => o.kind === 'Folder' && o.name === 'v2')
      .children.push({
        kind: 'MdxPage',
        name: 'index',
        route: '/v2',
        frontMatter: {},
      });
    pageOpts.pageMap
      .find(o => o.kind === 'Folder' && o.name === 'v3')
      .children.push({
        kind: 'MdxPage',
        name: 'index',
        route: '/v3',
        frontMatter: {},
      });
    pageOpts.pageMap
      .find(o => o.kind === 'Folder' && o.name === 'v4')
      .children.push({
        kind: 'MdxPage',
        name: 'index',
        route: '/v4',
        frontMatter: {},
      });
    return pageOpts;
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
