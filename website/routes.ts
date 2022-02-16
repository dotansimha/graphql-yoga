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
        ],
      },
      integrations: {
        $name: 'Integrations',
      },
      migration: {
        $name: 'Migration from',
      },
      testing: {
        $name: 'Testing',
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
      '00-introduction': {
        $name: 'Introduction',
      },
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
