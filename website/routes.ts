import { IRoutes, GenerateRoutes } from '@guild-docs/server'

export function getRoutes(): IRoutes {
  const Routes: IRoutes = {
    _: {
      'quick-start': {
        $name: 'Quick Start',
      },
      'extend-yoga': {
        $name: 'Extend Yoga',
        $routes: [
          ['subscriptions', 'Subscriptions'],
          ['graphiql', 'GraphiQL'],
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
    },
  }
  GenerateRoutes({
    Routes,
    ignorePaths: ['quick-start'],
    folderPattern: 'docs',
  })

  return {
    ...Routes,
    _: Object.fromEntries(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      Object.entries(Routes._).map(([key, value]) => [`docs/${key}`, value]),
    ),
  }
}
