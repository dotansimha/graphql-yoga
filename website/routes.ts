import { IRoutes, GenerateRoutes } from '@guild-docs/server'

export function getRoutes(): IRoutes {
  const Routes: IRoutes = {
    _: {
      docs: {
        $name: 'Quick Start',
        _: {
          integration: {
            $name: 'Integration',
            $routes: [
              'integration-with-fastify',
              'integration-with-express',
              'integration-with-koa',
              'integration-with-deno',
              'integration-with-cf',
            ],
          },
          'extend-yoga': {
            $name: 'Extend Yoga',
            $routes: [
              'envelop-plugins',
              'graphiql',
              'subscriptions',
              'defer-stream',
              'file-uploads',
              'federation',
            ],
          },
          migration: {
            $name: 'Migration from',
            $routes: [
              'apollo-server',
              'express-graphql',
              'fastify-gql',
              'helix-envelop',
            ],
          },
        },
      },
    },
  }
  GenerateRoutes({
    Routes,
    basePath: 'docs',
  })

  return Routes
}
