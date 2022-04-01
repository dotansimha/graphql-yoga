import { IRoutes, GenerateRoutes } from '@guild-docs/server'

export function getRoutes(): IRoutes {
  const Routes: IRoutes = {
    _: {
      'quick-start': {
        $name: 'Quick Start',
      },
      features: {
        $name: 'Features',
        $routes: [
          ['graphiql', 'GraphiQL'],
          ['error-masking', 'Error Masking'],
          ['subscriptions', 'Subscriptions'],
          ['file-uploads', 'File Uploads'],
          ['envelop-plugins', 'Envelop Plugins'],
          ['testing', 'Testing'],
        ],
      },
      integrations: {
        $name: 'Integrations',
      },
      migration: {
        $name: 'Migration from',
      },
    },
  }
  GenerateRoutes({
    Routes,
    ignorePaths: ['quick-start', 'testing'],
    folderPattern: 'docs',
  })

  return {
    ...Routes,
    _: Object.fromEntries(
      Object.entries(Routes._!).map(([key, value]) => [`docs/${key}`, value]),
    ),
  }
}

export function getTutorialRoutes(): IRoutes {
  const Routes: IRoutes = {
    _: {
      basic: {
        $name: 'Basic',
        $routes: [
          ['00-introduction', 'Introduction'],
          ['01-project-setup', 'Project Setup'],
          ['02-getting-started', 'Getting Started'],
          ['03-graphql-server', 'GraphQL Server'],
          ['04-a-simple-query', 'A simple Query'],
          ['05-a-simple-mutation', 'A simple Mutation'],
          ['06-adding-a-database', 'Adding a Database'],
          [
            '07-connecting-server-and-database',
            'Connection Server and Database',
          ],
          ['08-graph-relations', 'Graph Relations'],
          ['09-error-handling', 'Error Handling'],
          ['10-filtering-and-pagination', 'Filtering and Pagination'],
          ['11-summary', 'Summary'],
        ],
      },
      // advanced: {
      //   $name: 'Advanced',
      //   $routes: [
      //     ['00-introduction', 'Introduction'],
      //     ['01-authentication', 'Authentication'],
      //     ['02-subscriptions', 'Subscriptions'],
      //   ],
      // },
    },
  }

  return {
    ...Routes,
    _: Object.fromEntries(
      Object.entries(Routes._!).map(([key, value]) => [
        `tutorial/${key}`,
        value,
      ]),
    ),
  }
}
