import { IRoutes, GenerateRoutes } from '@guild-docs/server'

export function getRoutes(): IRoutes {
  const Routes: IRoutes = {
    _: {
      docs: {
        $name: 'Getting Started',
      },
    },
  }
  GenerateRoutes({
    Routes,
    basePath: 'docs',
  })

  return Routes
}
