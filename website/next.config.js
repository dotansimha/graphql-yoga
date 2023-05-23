import { withGuildDocs } from '@theguild/components/next.config'

export default withGuildDocs({
  transformPageOpts(pageOpts) {
    // TODO: temporal fix to show link for versioned folder in navbar (otherwise you can see only when navigated to it directly)
    pageOpts.pageMap
      .find((o) => o.kind === 'Folder' && o.name === 'v2')
      .children.push({
        kind: 'MdxPage',
        name: 'index',
        route: '/v2',
        frontMatter: {},
      })
    return pageOpts
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

      '/v3/features/incremental-delivery': '/docs/features/defer-stream',
      '/v3/features/defer-stream': '/docs/features/defer-stream',

      '/v3': '/docs',
      '/v3/comparison': '/docs/comparison',
      '/v3/features/apollo-federation': '/docs/features/apollo-federation',
      '/v3/features/automatic-persisted-queries':
        '/docs/features/automatic-persisted-queries',
      '/v3/features/context': '/docs/features/context',
      '/v3/features/cors': '/docs/features/cors',
      '/v3/features/envelop-plugins': '/docs/features/envelop-plugins',
      '/v3/features/error-masking': '/docs/features/error-masking',
      '/v3/features/file-uploads': '/docs/features/file-uploads',
      '/v3/features/graphiql': '/docs/features/graphiql',
      '/v3/features/health-check': '/docs/features/health-check',
      '/v3/features/introspection': '/docs/features/introspection',
      '/v3/features/logging-and-debugging':
        '/docs/features/logging-and-debugging',
      '/v3/features/parsing-and-validation-caching':
        '/docs/features/parsing-and-validation-caching',
      '/v3/features/persisted-operations':
        '/docs/features/persisted-operations',
      '/v3/features/request-batching': '/docs/features/request-batching',
      '/v3/features/response-caching': '/docs/features/response-caching',
      '/v3/features/schema': '/docs/features/schema',
      '/v3/features/sofa-api': '/docs/features/sofa-api',
      '/v3/features/subscriptions': '/docs/features/subscriptions',
      '/v3/features/testing': '/docs/features/testing',
      '/v3/integrations/integration-with-aws-lambda':
        '/docs/integrations/integration-with-aws-lambda',
      '/v3/integrations/integration-with-bun':
        '/docs/integrations/integration-with-bun',
      '/v3/integrations/integration-with-cloudflare-workers':
        '/docs/integrations/integration-with-cloudflare-workers',
      '/v3/integrations/integration-with-deno':
        '/docs/integrations/integration-with-deno',
      '/v3/integrations/integration-with-express':
        '/docs/integrations/integration-with-express',
      '/v3/integrations/integration-with-fastify':
        '/docs/integrations/integration-with-fastify',
      '/v3/integrations/integration-with-koa':
        '/docs/integrations/integration-with-koa',
      '/v3/integrations/integration-with-nestjs':
        '/docs/integrations/integration-with-nestjs',
      '/v3/integrations/integration-with-nextjs':
        '/docs/integrations/integration-with-nextjs',
      '/v3/integrations/integration-with-sveltekit':
        '/docs/integrations/integration-with-sveltekit',
      '/v3/integrations/z-other-environments':
        '/docs/integrations/z-other-environments',
      '/v3/migration/migration-from-apollo-server':
        '/docs/migration/migration-from-apollo-server',
      '/v3/migration/migration-from-express-graphql':
        '/docs/migration/migration-from-express-graphql',
      '/v3/migration/migration-from-yoga-v1':
        '/docs/migration/migration-from-yoga-v1',
      '/v3/migration/migration-from-yoga-v2':
        '/docs/migration/migration-from-yoga-v2',
    }).map(([from, to]) => ({
      source: from,
      destination: to,
      permanent: true,
    })),
  eslint: {
    ignoreDuringBuilds: true,
  },
})
